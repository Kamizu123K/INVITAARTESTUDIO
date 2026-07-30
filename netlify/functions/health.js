exports.handler = async function () {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({
      ok: true,
      service: 'Invita Arte Studio',
      version: '1.1.0',
      mode: 'frontend-estatico',
      note: 'Las tres APIs completas se ejecutan con server.js en el ambiente local Node.js.'
    })
  };
};
