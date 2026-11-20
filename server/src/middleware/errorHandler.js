const notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;

  if (err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File is too large';
  } else if (err.name === 'ValidationError') {
    status = 400;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  }

  if (status >= 500) {
    console.error(err);
    message = 'Something went wrong on the server';
  }

  const code = typeof err.code === 'string' && !err.code.startsWith('LIMIT_') ? err.code : undefined;
  res.status(status).json({ message, ...(code ? { code } : {}) });
};

module.exports = { notFound, errorHandler };
