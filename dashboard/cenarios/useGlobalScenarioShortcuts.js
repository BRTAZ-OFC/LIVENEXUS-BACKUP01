import { useState, useEffect, useRef } from 'react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import { triggerReloadRTC } from '@dashboard/conexao/rtc/ReloadRTC';
import {
  formatKeyFromEvent,
  matchesSubscenarioShortcut,
  broadcastScenarioChange,
} from './Scenario_shortcutHelper';

/**
 * Hook global para manter os atalhos de cenário e subcenário ativos em qualquer tela do LiveNexus.
 * Executa enquanto o LiveNexus estiver aberto e com foco, respeitando campos de digitação.
 */
export function useGlobalScenarioShortcuts() {
  const { userId, scenarioBranch, overlayBranch } = useNewUserDataCentral();
  const [cenarios, setCenarios] = useState([]);
  const cenariosRef = useRef(cenarios);
  cenariosRef.current = cenarios;

  // 1. Carrega a lista inicial de cenários do usuário
  useEffect(() => {
    if (!userId) return;
    scenarioBranch('GET')
      .then((data) => {
        if (Array.isArray(data)) {
          setCenarios(data);
        }
      })
      .catch((err) => console.error('Erro ao carregar cenários globais:', err));
  }, [userId, scenarioBranch]);

  // 2. Sincroniza quando os cenários forem alterados em qualquer parte da aplicação
  useEffect(() => {
    const handleCenariosUpdated = (e) => {
      if (Array.isArray(e.detail)) {
        setCenarios(e.detail);
      }
    };

    const handleStorage = (e) => {
      if (e.key && e.key.startsWith('scenario_active_sub_') && e.newValue) {
        try {
          const scenarioId = e.key.replace('scenario_active_sub_', '');
          const parsed = JSON.parse(e.newValue);
          if (parsed.subscenarioId) {
            setCenarios((prev) =>
              prev.map((c) =>
                String(c.id) === String(scenarioId)
                  ? {
                      ...c,
                      activeSubcenarioId: parsed.subscenarioId,
                      instances:
                        c.subcenarios?.find((s) => s.id === parsed.subscenarioId)?.instances ||
                        c.instances ||
                        [],
                      background:
                        c.subcenarios?.find((s) => s.id === parsed.subscenarioId)?.background ||
                        c.background ||
                        {},
                    }
                  : c
              )
            );
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('livenexus:cenarios-updated', handleCenariosUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('livenexus:cenarios-updated', handleCenariosUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // 3. Listener global de teclas ativo em todas as páginas do painel
  useEffect(() => {
    const heldKeys = new Set();

    const syncModifiers = (e) => {
      if (e.shiftKey) heldKeys.add('SHIFT'); else heldKeys.delete('SHIFT');
      if (e.ctrlKey) heldKeys.add('CTRL'); else heldKeys.delete('CTRL');
      if (e.altKey) heldKeys.add('ALT'); else heldKeys.delete('ALT');
      if (e.metaKey) heldKeys.add('WIN'); else heldKeys.delete('WIN');
    };

    const handleKeyDown = (e) => {
      syncModifiers(e);

      // Proteção rigorosa para campos de texto/digitação (não interceptar digitação)
      const activeEl = document.activeElement;
      if (activeEl) {
        const tag = activeEl.tagName ? activeEl.tagName.toUpperCase() : '';
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          activeEl.isContentEditable ||
          activeEl.getAttribute('contenteditable') === 'true' ||
          activeEl.getAttribute('role') === 'textbox'
        ) {
          return;
        }
      }

      const formatted = formatKeyFromEvent(e);
      if (formatted) heldKeys.add(formatted.toUpperCase());

      // Controles Globais do Contador de Mortes (Numpad +, Numpad -, Numpad Del)
      let deathAction = null;
      if (e.code === 'NumpadAdd' || (e.key === '+' && !e.ctrlKey && !e.altKey && !e.metaKey)) {
        deathAction = 'INCREMENT';
      } else if (e.code === 'NumpadSubtract' || (e.key === '-' && !e.ctrlKey && !e.altKey && !e.metaKey)) {
        deathAction = 'DECREMENT';
      } else if (e.code === 'NumpadDecimal' || e.code === 'NumpadComma' || ((e.code === 'Delete' || e.key === 'Delete') && !e.ctrlKey && !e.altKey && !e.metaKey)) {
        deathAction = 'RESET';
      }

      if (deathAction) {
        e.preventDefault();
        e.stopPropagation();

        const currentCenarios = cenariosRef.current;
        let anyUpdated = false;

        const updateInstanceCount = (inst) => {
          if (inst.widgetId !== 'manual-death-counter') return inst;
          const current = Math.max(0, Number(inst.config?.deathCount) || 0);
          let next = current;
          if (deathAction === 'INCREMENT') next = current + 1;
          else if (deathAction === 'DECREMENT') next = Math.max(0, current - 1);
          else if (deathAction === 'RESET') next = 0;
          return {
            ...inst,
            config: {
              ...inst.config,
              deathCount: next
            }
          };
        };

        if (Array.isArray(currentCenarios) && currentCenarios.length > 0) {
          const updated = currentCenarios.map((c) => {
            const hasDeath = (c.instances || []).some(i => i.widgetId === 'manual-death-counter') ||
                             (c.subcenarios || []).some(s => s.instances?.some(i => i.widgetId === 'manual-death-counter'));
            if (!hasDeath) return c;
            anyUpdated = true;

            return {
              ...c,
              instances: (c.instances || []).map(updateInstanceCount),
              subcenarios: (c.subcenarios || []).map(s => ({
                ...s,
                instances: (s.instances || []).map(updateInstanceCount)
              }))
            };
          });

          if (anyUpdated) {
            setCenarios(updated);
            scenarioBranch('POST', { payload: { cenarios: updated } }).catch((err) =>
              console.error('Erro ao persistir contador de mortes via atalho:', err)
            );
            window.dispatchEvent(
              new CustomEvent('livenexus:cenarios-updated', { detail: updated })
            );
          }
        }

        // Atualiza também overlays que contenham o contador de mortes
        if (overlayBranch) {
          overlayBranch('GET').then((overlaysList) => {
            if (!Array.isArray(overlaysList)) return;
            overlaysList.forEach((ov) => {
              const hasDeath = (ov.instances || []).some(i => i.widgetId === 'manual-death-counter');
              if (!hasDeath) return;
              const updatedInstances = (ov.instances || []).map(updateInstanceCount);
              overlayBranch('PATCH', {
                id: ov.id,
                payload: { changes: { instances: updatedInstances } }
              }).catch(() => {});
            });
          }).catch(() => {});
        }

        // Emite evento global para editores de cenário e overlay ativos sincronizarem
        window.dispatchEvent(
          new CustomEvent('livenexus:death-counter-action', {
            detail: { action: deathAction, timestamp: Date.now() }
          })
        );

        // Dispara sincronização RTC via ponto único global
        triggerReloadRTC('shortcut-death-counter');
        return;
      }

      const currentCenarios = cenariosRef.current;
      if (!Array.isArray(currentCenarios) || currentCenarios.length === 0) return;

      // Percorre os cenários buscando correspondência de atalho em seus subcenários
      for (const scen of currentCenarios) {
        if (!scen.subcenarios || scen.subcenarios.length === 0) continue;

        const matchedSub = scen.subcenarios.find((s) =>
          matchesSubscenarioShortcut(e, s, heldKeys)
        );

        if (matchedSub && matchedSub.id !== scen.activeSubcenarioId) {
          e.preventDefault();
          e.stopPropagation();

          const updated = currentCenarios.map((c) => {
            if (String(c.id) === String(scen.id)) {
              return {
                ...c,
                activeSubcenarioId: matchedSub.id,
                instances: matchedSub.instances || c.instances || [],
                background: matchedSub.background || c.background || {},
              };
            }
            return c;
          });

          setCenarios(updated);

          // Salva no backend
          scenarioBranch('POST', { payload: { cenarios: updated } }).catch((err) =>
            console.error('Erro ao persistir cenário via atalho global:', err)
          );

          // Notifica OBS e outras abas via BroadcastChannel e LocalStorage
          broadcastScenarioChange(scen.id, matchedSub.id);

          // Ponto único de sincronização RTC: transmite snapshot instantâneo (0ms) ou reinicia se fechado
          triggerReloadRTC('shortcut-execution');

          // Emite evento para componentes internos sincronizarem o estado
          window.dispatchEvent(
            new CustomEvent('livenexus:cenarios-updated', { detail: updated })
          );
          break;
        }
      }
    };

    const handleKeyUp = (e) => {
      syncModifiers(e);
      const formatted = formatKeyFromEvent(e);
      if (formatted) heldKeys.delete(formatted.toUpperCase());
    };

    const handleBlur = () => {
      heldKeys.clear();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) heldKeys.clear();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [scenarioBranch]);

  return { cenarios, setCenarios };
}
