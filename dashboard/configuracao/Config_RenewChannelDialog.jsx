import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@dashboard/componentes/dialog';
import { Button } from '@dashboard/componentes/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function RenewChannelDialog({ open, onOpenChange, platform, channelIdentifier, onConfirm, loading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-white/10 bg-black/90 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle size={18} className="text-amber-400" /> Deseja realmente remover este canal?
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Ao continuar, o vínculo atual será removido. Você precisará realizar novamente todo o processo de verificação para conectar outro canal.
          </DialogDescription>
        </DialogHeader>
        {channelIdentifier && (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            {platform} · <span className="font-medium text-white">{channelIdentifier}</span>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="border-white/10 bg-transparent text-slate-200 hover:bg-white/10">
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-red-500 text-white hover:bg-red-400">
            {loading ? 'Removendo…' : 'Remover vínculo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}