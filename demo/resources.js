// Capabilities of the two different server types that are currently able to
// provide the DELPH-IN restful API.
CAPABILITIES = {
    'lkb' : { 
        'tree' : ['json'],
        'mrs' : ['json', 'latex'],
        'eds' : ['json', 'latex'],
        'dmrs' : []
    },
    'pydelphin' : { 
        'tree' : ['json'],
        'mrs' : ['json'],
        'eds' : [],
        'dmrs' : ['json', 'latex']
    }
};


// Ordered list of grammar resource identifiers for presenting in the demo.
// Should correspond to keys of RESOURCES object.
var GRAMMARS = [
    'erg1214-uw',
    'erg-uio',
    'erg2018-uw',
    'jacy-uw',
    'indra-uw',
    'zhong-uw',
    //'gg-um',
    //'hag-um'
];


var RESOURCES = {
    'erg-uio': {
        grammar: 'ERG 1214',
        lang: 'eng',
        server: 'lkb',
        location: 'UiO',
        url: 'http://erg.delph-in.net/rest/0.9/parse',
        inputs: ['Abrams knew that it rained.']
    },
    'erg1214-uw': {
        grammar: 'ERG 1214',
        lang: 'eng',
        server: 'pydelphin',
        location: 'UW',
        url: 'http://chimpanzee.ling.washington.edu/bottlenose/erg-1214/parse',
        inputs: ['Abrams knew that it rained.']
    },
    'erg2018-uw': {
        grammar: 'ERG 2018',
        lang: 'eng',
        server: 'pydelphin',
        location: 'UW',
        url: 'http://chimpanzee.ling.washington.edu/bottlenose/erg-2018/parse',
        inputs: ['Abrams knew that it rained.']
    },
    'jacy-uw': {
        grammar: 'Jacy',
        lang: 'jpn',
        server: 'pydelphin',
        location: 'UW',
        url: 'http://chimpanzee.ling.washington.edu/bottlenose/jacy/parse',
        inputs: ['太郎 が 雨 が 降っ た こと を 知っ て い た ．']
    },
    'indra-uw': {
        grammar: 'Indra',
        lang: 'ind',
        server: 'pydelphin',
        location: 'UW',
        url: 'http://chimpanzee.ling.washington.edu/bottlenose/indra/parse',
        inputs: ['Adi tahu bahwa hujan sudah turun.']
    },
    'zhong-uw': {
        grammar: 'Zhong',
        lang: 'cmn',
        server: 'pydelphin',
        location: 'UW',
        url: 'http://chimpanzee.ling.washington.edu/bottlenose/zhong/parse',
        inputs: ['张三 知道 下 过 雨 。']
    }
    // currently offline
    // 'gg-um': {
    //     grammar: 'gg',
    //     lang: 'deu',
    //     server: 'pydelphin',
    //     location: 'UM',
    //     url: 'http://nedned.cis.unimelb.edu.au/bottlenose/gg/parse',
    //     inputs: ['Abrams wusste, dass es regnete.']
    // },
    // 'hag-um': {
    //     grammar: 'Hausa',
    //     lang: 'hau',
    //     server: 'pydelphin',
    //     location: 'UM',
    //     url: 'http://nedned.cis.unimelb.edu.au/bottlenose/hag/parse',
    //     inputs: ['Állàh yà gáafàrtà máalàm']
    // }
};
