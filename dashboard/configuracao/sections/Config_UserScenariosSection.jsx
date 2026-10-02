import React from 'react';
import DocumentSections from '@dashboard/painel-admin/dataCentral/DataCentral_DocumentSections';

export default function UserScenariosSection() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Cenários de Configuração</h2>
        <p className="text-xs text-slate-400 mb-4">
          Visualização e gerenciamento de cenários cadastrados pelos ramais do Johnson CRUD.
        </p>
        <DocumentSections domain="scenarios" />
      </div>
    </div>
  );
}
