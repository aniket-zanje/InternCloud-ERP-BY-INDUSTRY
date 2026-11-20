// Small helper: throw httpError(404, 'Not found') anywhere inside a handler
module.exports = (status, message, code) =>
  Object.assign(new Error(message), { status, code });
