'use strict';
/* Hidden stand-ins for interface elements we removed.
 *
 * The supplied app.js and cpi.js attach handlers to elements at load time - el('searchPairs').onclick
 * and so on. Deleting that markup would make those lines throw, and everything after them in the
 * file would never run. Rather than edit two files we did not write, this creates an off-screen stub
 * for each removed id before they load, so the old code finds what it expects and does nothing
 * visible. Remove this file only if app.js and cpi.js are rewritten.
 */
(function () {
  const removed = [
  ['bioemuContacts', 'div'],
  ['bioemuDownload', 'button'],
  ['bioemuExport', 'button'],
  ['bioemuFrame', 'input'],
  ['bioemuFrameInfo', 'div'],
  ['bioemuGeometry', 'div'],
  ['bioemuIdentity', 'div'],
  ['bioemuImport', 'button'],
  ['bioemuLoad', 'button'],
  ['bioemuMolecule', 'div'],
  ['bioemuPanel', 'div'],
  ['bioemuPlay', 'button'],
  ['bioemuScene', 'div'],
  ['bioemuStatus', 'div'],
  ['browsePdb', 'button'],
  ['browseStructure', 'button'],
  ['coverageStatus', 'div'],
  ['coverageTable', 'div'],
  ['matchedOnly', 'input'],
  ['nextPairs', 'button'],
  ['pairSearch', 'input'],
  ['pairSelect', 'select'],
  ['pdbCounts', 'div'],
  ['pdbExplorer', 'div'],
  ['pdbInventory', 'select'],
  ['pdbInventoryStatus', 'div'],
  ['preprocessingResults', 'div'],
  ['previousPairs', 'button'],
  ['refreshCoverage', 'button'],
  ['searchPairs', 'button'],
  ['testedResults', 'div'],
  ];
  const attic = document.createElement('div');
  attic.id = 'removed-controls';
  attic.hidden = true;
  attic.style.display = 'none';
  for (const [id, tag] of removed) {
    if (document.getElementById(id)) continue;
    const node = document.createElement(tag);
    node.id = id;
    if (tag === 'input') node.type = id === 'matchedOnly' ? 'checkbox' : 'text';
    attic.appendChild(node);
  }
  (document.body || document.documentElement).appendChild(attic);
})();
