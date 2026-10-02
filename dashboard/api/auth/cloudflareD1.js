/**
 * Conexão direta e real com o banco de dados Cloudflare D1.
 * Utiliza as credenciais oficiais da Cloudflare para executar todas as queries
 * diretamente na API REST do Cloudflare D1 em tempo real, sem mocks, sem proxies
 * em memória e sem usuários falsos.
 */

const CLOUDFLARE_DATABASE_ID = 'fd7c8e76-9e16-4801-b63a-d1725b6933c2';

let d1Instance = null;

export function getCloudflareD1() {
  if (d1Instance) return d1Instance;

  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    console.error('[Cloudflare D1] CLOUDFLARE_API_TOKEN ou CLOUDFLARE_ACCOUNT_ID não configurados.');
    return null;
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${CLOUDFLARE_DATABASE_ID}/query`;

  async function execute(sql, params = []) {
    console.log(`[Cloudflare D1] Executing: ${sql}`, params.length ? `| Params: ${JSON.stringify(params)}` : '');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });

    const json = await res.json();
    if (!json.success) {
      const errorMsg = json.errors?.[0]?.message || 'Falha na query do Cloudflare D1';
      console.error(`[Cloudflare D1] Error: ${errorMsg}`);
      throw new Error(`[Cloudflare D1] ${errorMsg}`);
    }

    const firstResult = json.result?.[0] || {};
    const results = firstResult.results || [];
    console.log(`[Cloudflare D1] Query success. Rows returned: ${results.length}`);
    return {
      results,
      meta: firstResult.meta || {}
    };
  }

  d1Instance = {
    prepare(sql) {
      let boundParams = [];
      const queryObj = {
        bind(...args) {
          boundParams = args;
          return queryObj;
        },
        async first(col) {
          const { results } = await execute(sql, boundParams);
          if (!results || results.length === 0) return null;
          return col ? results[0][col] : results[0];
        },
        async all() {
          const { results } = await execute(sql, boundParams);
          return { results: results || [] };
        },
        async run() {
          const { meta, results } = await execute(sql, boundParams);
          return { success: true, meta, results };
        }
      };
      return queryObj;
    }
  };

  return d1Instance;
}
