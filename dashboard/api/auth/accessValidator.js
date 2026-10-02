/**
 * Utilitário de validação de acesso documental.
 * Garante que usuários comuns só acessem seus próprios dados (baseado na sessão),
 * enquanto administradores e visualizadores públicos (sem sessão) podem usar o userId da URL.
 */
export function getAuthorizedUserId(req) {
  const url = new URL(req.url, 'http://localhost');
  const queryUserId = url.searchParams.get('userId');
  const sessionUserId = req.documentUserId;
  const isAdmin = String(req.documentUserRole || '').toLowerCase() === 'admin';

  // 1. Se o usuário estiver autenticado
  if (sessionUserId) {
    // Se for Admin, ele pode atuar em nome de outro usuário (Central/Admin) se passar o userId na URL
    if (isAdmin && queryUserId) {
      return queryUserId;
    }
    // Para usuários comuns (ou Admins em suas próprias páginas de config), usamos estritamente o ID da sessão
    return sessionUserId;
  }

  // 2. Se não houver sessão (ex: visualizador público do overlay/cenário)
  // Permitimos o uso do userId da query string para que o conteúdo seja carregado
  return queryUserId || null;
}
