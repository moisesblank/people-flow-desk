// ============================================
// 🧪 APP DIAGNÓSTICO TEMPORÁRIO
// Teste para isolar React Error #61
// ============================================

export default function App() {
  return (
    <div style={{ 
      color: 'white', 
      padding: 40, 
      background: '#000',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅ React está vivo!</h1>
      <p style={{ opacity: 0.7 }}>Se você vê isso, o problema está nos Providers/Guards.</p>
      <p style={{ opacity: 0.5, marginTop: '1rem', fontSize: '0.875rem' }}>
        Timestamp: {new Date().toISOString()}
      </p>
    </div>
  );
}
