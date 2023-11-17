var convertToJSON = function(data, origin) {
  return (origin == 'cloc') ? convertFromClocToJSON(data) : convertFromWcToJSON(data);
};

/**
 * Convert the output of cloc in csv to JSON format
 *
 *  > cloc . --csv --exclude-dir=vendor,tmp --by-file --report-file=data.cloc
 */
var convertFromClocToJSON = function(data) {
  var lines = data.split("\n");
  lines.shift(); // drop the header line

  var json = {};
  lines.forEach(function(line) {
    var cols = line.split(',');
    var filename = cols[1];
    if (!filename) return;
    var elements = filename.split(/[\/\\]/);
    var current = json;
    elements.forEach(function(element) {
      if (!current[element]) {
        current[element] = {};
      }
      current = current[element];
    });
    current._codeflower_leaf_info = {
      language: cols[0],
      size: parseInt(cols[4], 10)
    }
  });

  return getHierarchy('root', json);
};

/**
 * Convert the output of wc to JSON format
 *
 *  > git ls-files | xargs wc -l
 */
var convertFromWcToJSON = function(data) {
  var lines = data.split("\n");

  var json = {};
  var filename, size, cols, elements, current;
  lines.forEach(function(line) {
      cols = line.trim().split(' ');
      size = parseInt(cols[0], 10);
      if (!size) return;
      filename = cols[1];
      if (filename === "total") return;
      if (!filename) return;
      elements = filename.split(/[\/\\]/);
      current = json;
      elements.forEach(function(element) {
          if (!current[element]) {
              current[element] = {};
          }
          current = current[element];
      });
      current._codeflower_leaf_info = {
        size: size
      }
  });

  return getHierarchy('root', json);
};

/**
 * Convert a simple json object into another specifying children as an array
 * Works recursively
 *
 * example input:
 * { a: { b: { c: { size: 12 }, d: { size: 34 } }, e: { size: 56 } } }
 * example output
 * { name: a, children: [
 *   { name: b, children: [
 *     { name: c, size: 12 },
 *     { name: d, size: 34 }
 *   ] },
 *   { name: e, size: 56 }
 * ] } }
 */
var getHierarchy = function(name, node) {
  const leaf = node._codeflower_leaf_info
  if(leaf) {
    return {
      name: name,
      size: leaf.size,
      language: leaf.language,
    }
  } else {
    return {
      name: name,
      children: Object.keys(node).map(name => getHierarchy(name, node[name]))
    }
  }
};

// Recursively count all elements in a tree
var countElements = function(node) {
  var nbElements = 1;
  if (node.children) {
    nbElements += node.children.reduce(function(p, v) { return p + countElements(v); }, 0);
  }
  return nbElements;
};

module.exports = {convertToJSON}
