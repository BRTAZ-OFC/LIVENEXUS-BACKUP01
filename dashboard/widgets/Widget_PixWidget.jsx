import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useStreaming } from '@dashboard/configuracao/Config_StreamingContext';

// Função utilitária para gerar payload Pix BR Code (EMV QRCPS) padrão Banco Central
export function generatePixPayload(key = '', name = 'LIVENEXUS STREAMER', city = 'SAO PAULO', txid = '***', amount = '') {
  const cleanKey = key.trim();
  const cleanName = name.substring(0, 25).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const cleanCity = city.substring(0, 15).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const cleanTxid = txid.substring(0, 25).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  function formatField(id, val) {
    return id.toString().padStart(2, '0') + val.length.toString().padStart(2, '0') + val;
  }

  // Merchant Account Information (ID 26)
  const gui = formatField(0, 'br.gov.bcb.pix');
  const keyField = formatField(1, cleanKey);
  const merchantAccountInfo = formatField(26, gui + keyField);

  let payload = '';
  payload += formatField(0, '01'); // Payload Format Indicator
  payload += formatField(1, '12'); // Point of Initiation Method (11 para uso único, 12 para recorrente)
  payload += merchantAccountInfo;
  payload += formatField(52, '0000'); // Merchant Category Code
  payload += formatField(53, '986');  // Currency Code BRL
  
  let cleanAmount = '';
  if (amount) {
    cleanAmount = String(amount).replace(',', '.').replace(/[^0-9.]/g, '');
  }
  if (cleanAmount && !isNaN(parseFloat(cleanAmount)) && parseFloat(cleanAmount) > 0) {
    payload += formatField(54, parseFloat(cleanAmount).toFixed(2));
  }
  
  payload += formatField(58, 'BR');   // Country Code
  payload += formatField(59, cleanName);
  payload += formatField(60, cleanCity);

  // Additional Data Field Template (ID 62)
  const txidField = formatField(5, cleanTxid);
  payload += formatField(62, txidField);

  // CRC16
  payload += '6304';

  // CRC16 Checksum
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    const byte = payload.charCodeAt(i);
    crc ^= (byte << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  const crcStr = crc.toString(16).toUpperCase().padStart(4, '0');
  return payload + crcStr;
}

export default function PixWidget({ config = {}, instanceId }) {
  const { liveActivity } = useStreaming();
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const pixKey = config.pixKey || '';
  const pixName = config.pixName || 'LIVENEXUS STREAMER';
  const pixCity = config.pixCity || 'SAO PAULO';
  const pixAmount = config.pixAmount || '';

  // Gera o QR Code localmente com base na chave Pix sempre que ela ou configurações mudarem
  useEffect(() => {
    if (!pixKey) {
      setQrCodeDataUrl('');
      return;
    }

    try {
      const payload = generatePixPayload(pixKey, pixName, pixCity, '***', pixAmount);
      QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('[PixWidget] Erro ao gerar QR Code:', err));
    } catch (err) {
      console.error('[PixWidget] Erro na geração:', err);
    }
  }, [pixKey, pixName, pixCity, pixAmount]);

  // Escuta o chat da Twitch à procura do comando !pix para disparar a visibilidade do widget
  useEffect(() => {
    const lastMsg = liveActivity?.lastMessage;
    if (!lastMsg) return;

    // Verifica se a mensagem de chat inicia com !pix (ignorando maiúsculas/minúsculas)
    const isPixCommand = lastMsg.text && lastMsg.text.trim().toLowerCase().startsWith('!pix');
    if (isPixCommand && instanceId) {
      console.log(`[PixWidget] Comando !pix recebido de ${lastMsg.author || 'espectador'}. Disparando exibição para a widget: ${instanceId}`);
      
      // Dispara o evento de Tempo Visível existente no projeto para exibir a widget temporariamente
      window.dispatchEvent(
        new CustomEvent('livenexus:trigger-tempo-visivel', {
          detail: { instanceId }
        })
      );
    }
  }, [liveActivity?.lastMessage, instanceId]);

  const handleCopy = () => {
    if (!pixKey) return;
    try {
      const payload = generatePixPayload(pixKey, pixName, pixCity, '***', pixAmount);
      navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar Pix Copia e Cola:', err);
    }
  };

  const presetStyle = Number(config.structuralPreset) || 1;

  // Renderização elegante adaptada aos presets visuais já existentes no LiveNexus
  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-between p-4 rounded-xl text-white shadow-xl border select-none transition-all duration-300"
      style={{
        fontFamily: config.fontFamily || 'Inter, sans-serif',
        background: config.backgroundColor || 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        borderColor: config.borderColor || 'rgba(168, 85, 247, 0.4)'
      }}
    >
      {/* Cabeçalho */}
      <div className="text-center w-full">
        <h3 className="text-base font-bold tracking-wider text-purple-400 uppercase">
          {config.title || 'Apoie a Live'}
        </h3>
        <p className="text-[10px] text-slate-400">
          {pixAmount ? `Valor sugerido: R$ ${String(pixAmount).replace('.', ',')}` : 'Escaneie o QR Code para doar'}
        </p>
      </div>

      {/* QR Code Container */}
      <div className="flex-1 flex items-center justify-center my-3 relative group">
        {qrCodeDataUrl ? (
          <div className="bg-white p-2 rounded-lg border-2 border-purple-500/50 shadow-md">
            <img 
              src={qrCodeDataUrl} 
              alt="QR Code Pix" 
              className="w-32 h-32 md:w-36 md:h-36 object-contain"
            />
          </div>
        ) : (
          <div className="w-32 h-32 md:w-36 md:h-36 bg-slate-900 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-center p-2 text-[10px] text-slate-500">
            <span>Chave Pix não configurada</span>
          </div>
        )}
      </div>

      {/* Chave Pix e Copia e Cola */}
      <div className="w-full text-center">
        {pixKey ? (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="text-[11px] font-mono text-slate-300 truncate max-w-full px-2 py-1 bg-slate-950/40 rounded border border-slate-800">
              Chave: {pixKey}
            </div>
            <button
              onClick={handleCopy}
              className="text-[11px] font-medium bg-purple-600 hover:bg-purple-500 active:scale-95 text-white py-1 px-3 rounded-md transition-all duration-150 shadow border border-purple-400/20"
            >
              {copied ? '✓ Copiado!' : 'Copiar Chave Copia e Cola'}
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-slate-500 italic">Digite e salve a chave Pix nas configurações</span>
        )}
      </div>
    </div>
  );
}
