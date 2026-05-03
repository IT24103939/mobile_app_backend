function mapDoc(doc) {
  if (!doc) {
    return null;
  }

  const raw = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, password, ...rest } = raw;

  return {
    id: String(_id),
    ...rest
  };
}

function mapDocs(docs) {
  return docs.map(mapDoc);
}

module.exports = {
  mapDoc,
  mapDocs
};
