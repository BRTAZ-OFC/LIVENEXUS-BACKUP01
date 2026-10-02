import { useEffect, useRef } from 'react';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';
import { dispatch, registerHandlers, unregisterHandlers } from '@dashboard/configuracao/actionEngine/Config_actionEngine';
import { startKeyboardProvider, stopKeyboardProvider } from '@dashboard/configuracao/actionEngine/providers/Config_keyboardProvider';

const TTS_ACTION_IDS = ['tts.toggle', 'tts.clearQueue', 'tts.test', 'tts.skip'];
import ActionList from '@dashboard/configuracao/commands/Config_ActionList';

export default function CommandsSection() {
  const { pauseReading, clearMessages, sendTest, skipCurrent } = useStreaming();
  const fnsRef = useRef({ pauseReading, clearMessages, sendTest, skipCurrent });
  fnsRef.current = { pauseReading, clearMessages, sendTest, skipCurrent };

  useEffect(() => {
    registerHandlers({
      'tts.toggle': () => fnsRef.current.pauseReading(),
      'tts.clearQueue': () => fnsRef.current.clearMessages(),
      'tts.test': () => fnsRef.current.sendTest(),
      'tts.skip': () => fnsRef.current.skipCurrent(),
    });
    startKeyboardProvider((actionId, ctx) => dispatch(actionId, ctx));
    return () => {
      stopKeyboardProvider();
      unregisterHandlers(TTS_ACTION_IDS);
    };
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-white">Central de Atalhos</h2>
        <p className="text-sm text-slate-400">Associe combinações de teclas às ações do LiveNexus.</p>
      </header>
      <ActionList />
      <p className="text-xs text-slate-500">Mais ações serão adicionadas posteriormente.</p>
    </div>
  );
}