# RTC_PROVEN_FORMULA.md

> **VERSÃO COMPROVADA — NÃO MODIFICAR**
>
> **Data da versão comprovada:** 2026-09-15  
> **Status:** COMPROVADO EM TESTE REAL EM PRODUÇÃO

---

## 1. Resumo da Comprovação

A arquitetura de transmissão WebRTC ponto-a-ponto para o Laboratório do LiveNexus foi testada e validada em ambiente real de produção entre dois dispositivos completamente distintos através da internet pública:

- **Publisher:** Boosteroid / PC
- **Consumer:** Dispositivo Celular
- **Signaling remoto:** Funcionando via HTTP POST / SSE (`ntfy.sh`)
- **RTCDataChannel:** Estabelecido e conectado com sucesso
- **Teste Overlay Multichat:** **PASSOU** (renderizado com fidelidade visual no Consumer)
- **Teste Cena Real:** **PASSOU** (composição completa 1920x1080 com elementos, widgets e estados renderizados no Consumer)
- **Conexão remota Publisher (Boosteroid/PC) → Consumer (Celular):** **PASSOU**

---

## 2. Fluxo da Fórmula

```
[Publisher (PC/Boosteroid)]
         │
         ▼
[Signaling Remoto (ntfy.sh - canal isolado por runtimeId)]
         │ (ready / offer / answer / ICE candidates / close)
         ▼
[Negociação WebRTC Ponto-a-Ponto]
         │
         ▼
[RTCDataChannel Aberto ('livenexus-rtc-live')]
         │ (snapshot inicial completo + eventos incrementais live)
         ▼
[Consumer (Celular / PRISM / Browser)]
         │
         ▼
[RtcContentRenderer (Cena Real / Overlay Real)]
```

---

## 3. Regras de Isolamento e Transporte

1. **Signaling Remoto:**
   - Transporta **SOMENTE** dados estritamente necessários à negociação WebRTC: `runtimeId`, `ready`, `offer`, `answer`, `candidate`, `close` e metadados mínimos de identificação da fonte.
   - **É terminantemente PROIBIDO** transportar pelo signaling: chat, multichat, contadores, metas, viewers, snapshot live, scene_update ou eventos dinâmicos da transmissão.

2. **RTCDataChannel:**
   - Todos os dados dinâmicos da transmissão (snapshot inicial do bridge/cena e eventos incrementais em tempo real) trafegam **EXCLUSIVAMENTE** pelo `RTCDataChannel` após a abertura do canal.

3. **Isolamento de Sessão:**
   - Cada sessão possui um `runtimeId` único e isolado.
   - Não há leitura de histórico antigo (`since=all` omitido).
   - Sem contaminação entre sessões antigas ou diferentes fontes.

---

## 4. Arquivos que Fazem Parte da Fórmula Congelada

Área de backup: `dashboard/conexao/`

- `dashboard/conexao/rtcPublisher.js` — Controlador WebRTC do Publisher (DataChannel, captura de estado real e disparo de eventos)
- `dashboard/conexao/rtcConsumer.js` — Controlador WebRTC do Consumer (negociação, recepção de dados e atualização de estado)
- `dashboard/conexao/rtcSignaling.js` — Sinalização remota isolada via ntfy.sh (HTTP POST / SSE)
- `dashboard/conexao/rtcUrlParser.js` — Parser e resolução de URLs reais de cenas e overlays
- `dashboard/conexao/RtcContentRenderer.jsx` — Renderizador visual de Cenas e Widgets reais a partir do DataChannel
- `dashboard/conexao/RtcLabPublisher.jsx` — Componente de UI do Publisher Manual
- `dashboard/conexao/RtcConsumerLabPage.jsx` — Página standalone do Consumer Manual

---

> **AVISO IMPORTANTE:** Os arquivos dentro da pasta `provenBackup/` representam o backup congelado e a referência imutável da fórmula comprovada. Nenhuma implementação futura de automação deve alterar esses arquivos.
