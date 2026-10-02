import MetricsBar from '@dashboard/configuracao/Config_MetricsBar';
import { PLATFORMS, isConnectionActive } from '@dashboard/configuracao/Config_StreamingContext';
import MessagesTable from '@dashboard/configuracao/Config_MessagesTable';
import ChatFeed from '@dashboard/configuracao/Config_ChatFeed';
import LastLives from '@dashboard/configuracao/Config_LastLives';

export default function OverviewSection({ connections, messages, ttsCount, speakerCounts, test, setTest, sendTest, speaking, onPauseReading, onClear }) {
  const platforms = PLATFORMS || ['Twitch', 'Kick'];
  const connected = platforms
    .map(p => ({
      platform: p,
      channel: connections?.[p]?.channel,
      viewers: connections?.[p]?.viewers,
      status: connections?.[p]?.status || 'idle'
    }))
    .filter(c => isConnectionActive(c.status));

  return (
    <div className="space-y-5">
      <MetricsBar connected={connected} messagesCount={messages?.length || 0} ttsCount={ttsCount || 0} />
      <div className="grid gap-4 lg:grid-cols-2">
        <MessagesTable messages={messages} speaking={speaking} onPause={onPauseReading} onClear={onClear} speakerCounts={speakerCounts} />
        <ChatFeed messages={messages} test={test} setTest={setTest} onSend={sendTest} />
      </div>
      <LastLives />
    </div>
  );
}