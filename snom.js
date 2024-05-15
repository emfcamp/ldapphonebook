const ldap = require('ldapjs');
const server = ldap.createServer();
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
          dn: 'o=emf',
          attributes: {
            sn: pb.label,
            cn: pb.label.toLowerCase(),
            label: `${pb.label} (${pb.value})`,
            n: pb.value,
            telephoneNumber: [parseInt(pb.value)],
            objectClass: ['top', 'person', 'organizationalPerson']
          }
      };
      phonebook.push(obj)
  })
  console.log("Phonebook Updated - "+data.length+" items")
}

server.search('dc=emf', (req, res, next) => {
    console.log(req.filter)
    for (const entry of phonebook) {
        if (req.filter.matches(entry.attributes)){
            res.send(entry);
            console.log(entry.attributes)
        }
            
    }
    res.end();
  });

updatePB()
setInterval(updatePB, 60000)
server.listen(1389, '0.0.0.0', function() {
    console.log('LDAP server listening at: ' + server.url);
  });

