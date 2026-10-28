// A medição só roda no site de verdade. Prévias da Vercel e o computador de quem desenvolve não entram nos números;
// COLETA_ATIVA=1 liga na máquina local, para testar.
export const coletaAtiva = () => process.env.VERCEL_ENV === 'production' || process.env.COLETA_ATIVA === '1'
