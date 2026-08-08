function generateAccountId() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ACC${random}`;
}

function generateReferenceId(prefix) {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

module.exports = { generateAccountId, generateReferenceId };
