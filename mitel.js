const logger = require('pino')({ level: 'debug' })
const ldap = require('ldapjs');
const Attribute = require('@ldapjs/attribute')
const {
  SearchResultEntry: SearchEntry,
} = require('@ldapjs/messages')
const parseDN = require('@ldapjs/dn').DN.fromString
const server = ldap.createServer({ log: logger });
const fetch = require('node-fetch');

let phonebook = []

let url = "https://phones.emfcamp.org/api/phonebook/EMF2024";
let settings = { method: "Get"};

async function updatePB(){
    const response = await fetch(url, settings);
    const data = await response.json();
    phonebook = []
    data.forEach(pb => {
      let obj = {
          dn: `cn=${pb.value},ou=EMF2024,dc=emf`,
          attributes: {
            ou: 'EMF2024',
            sn: [pb.label.toString()],
            cn: [pb.value.toString()],
            telephoneNumber: [pb.value.toString()],
            objectClass: ['top', 'person', 'organizationalPerson']
          }
      };
      phonebook.push(obj)
  })
  logger.info("Phonebook Updated - "+data.length+" items")
}

function patchEntry(res, entry, nofiltering) {
    if (!entry || typeof (entry) !== 'object') { throw new TypeError('entry (SearchEntry) required') }
    if (nofiltering === undefined) { nofiltering = false }
    if (typeof (nofiltering) !== 'boolean') { throw new TypeError('noFiltering must be a boolean') }
    if (!entry.attributes) { throw new Error('entry.attributes required') }
    const savedAttrs = {}

    const all = (res.attributes.indexOf('*') !== -1)
    // Filter attributes in a plain object according to the magic `_` prefix
    // and presence in `notAttributes`.
    Object.keys(entry.attributes).forEach(function (a) {
      const _a = a//.toLowerCase()
      if (!nofiltering && _a.length && _a[0] === '_') {
        savedAttrs[a] = entry.attributes[a]
        delete entry.attributes[a]
      } else if (!nofiltering && res.notAttributes.indexOf(_a) !== -1) {
        savedAttrs[a] = entry.attributes[a]
        delete entry.attributes[a]
      } else if (all) {
        // do nothing
      } else if (res.attributes.length && res.attributes.indexOf(_a) === -1) {
        savedAttrs[a] = entry.attributes[a]
        delete entry.attributes[a]
      }
    })

    save = entry
    entry = new SearchEntry({
      objectName: typeof (save.dn) === 'string' ? parseDN(save.dn) : save.dn,
      messageId: res.messageId,
      attributes: Attribute.fromObject(entry.attributes)
    })

    // Restore attributes
    Object.keys(savedAttrs).forEach(function (k) {
      save.attributes[k] = savedAttrs[k]
    })

    return entry
}

server.search('dc=emf', (req, res, next) => {
    for (const entry of phonebook) {
        if (req.filter.matches(entry.attributes)){
            res.send(patchEntry(res, entry));
        }
            
    }
    res.end();
  });

updatePB()
setInterval(updatePB, 60000)
server.listen(389, '0.0.0.0', function() {
    logger.info('LDAP server listening at: ' + server.url);
  });

