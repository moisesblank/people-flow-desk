// nuclearShield.ts - VERSÃO SIMPLES
function isOwner(): boolean {
  const session = localStorage.getItem('sb-...-auth-token');
  const email = JSON.parse(session)?.user?.email;
  return email === 'moisesblank@gmail.com';
}

// Verificar UMA VEZ na inicialização
if (isOwner()) {
  return; // Não ativa proteções
}

// Ativar proteções
