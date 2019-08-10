#!/usr/bin/env node

'use strict';

var path = require('path');
var fs = require('fs');

var componentName;

var program = require('commander').version(require('../package.json').version).arguments('<component-directory>').action(function (name) {
  componentName = name;
}).option('-a, --actstore', 'Screen Component with ActStore').option('-m, --minimal', 'Screen Component with only index.js').parse(process.argv);

createComponent(componentName);

function createComponent(name) {
  var root = path.resolve('src/screens', name);

  if (!fs.existsSync(root)) {
    fs.mkdirpSync(root);
  }

  if (program.minimal) {
    console.log(isUpperCase(name) + ' Component ' + name + ' with just index.js created');
    return fs.writeFileSync(path.join(root, 'index.js'), 'import React from \'react\';\n' + '\n' + 'export default ({  }) => {\n' + ('  console.log("' + (name.charAt(0).toUpperCase() + name.slice(1)) + 'Screen render");\n') + '  return (\n' + '    <div className="">\n' + '      \n' + '    </div>\n' + '  );\n' + '}\n');
  }

  if (program.actstore) {
    fs.writeFileSync(path.join(root, 'comps.js'), 'import React from \'react\';\n' + 'import useActStore from \'actstore\';\n' + '\n' + 'export default ({  }) => {\n' + '  const { act, store } = useActStore();\n' + ('  console.log("' + (name.charAt(0).toUpperCase() + name.slice(1)) + 'Screen render");\n') + '  return (\n' + '    <div className="">\n' + '      \n' + '    </div>\n' + '  );\n' + '}\n');
  } else {
    // Without option
    var type = void 0;
    name === name.charAt(0).toLowerCase() + name.slice(1) ? type = 'Screen' : type = 'Component';
    fs.writeFileSync(path.join(root, 'comps.js'), 'import React from \'react\';\n' + '\n' + 'export default ({  }) => {\n' + ('  console.log("' + name + type + ' render");\n') + '  return (\n' + '    <div className="">\n' + '      \n' + '    </div>\n' + '  );\n' + '}\n');
  }
  fs.writeFileSync(path.join(root, 'elems.js'), 'export const Elem = ({  }) => (\n' + '  <div>\n' + '    \n' + '  </div>\n' + ');');
  fs.writeFileSync(path.join(root, 'hooks.js'), 'export const actions = ({ act, store }) => ({\n' + '  APP_INIT: () => {\n' + '    \n' + '  },\n' + '});');

  console.log(isUpperCase(name) + ' Component ' + name + (program.actstore ? ' with useActStore()' : '') + ' created');
}

function isUpperCase(name) {
  return name === name.charAt(0).toUpperCase() + name.slice(1) ? 'Custom' : 'Screen';
}