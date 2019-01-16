// In a node.js environment
var Parse = require('parse/node');

Parse.initialize("CoachZacId");
Parse.serverURL = "http://localhost:1982/use";


var clubs = [];

clubs.push({
    name: "Iate Clube de Brasília",
    url: "http://www.iateclubedebrasilia.com.br/",
    adress: "Setor de Clubes Esportivos Norte Trecho 2 Conjunto 4 - Asa Norte, Brasília - DF, 70800 - 120",
    phone: "61 3329-8700",
    lat: -15.777288,
    long: -47.8607186,
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqO-cDp_JEUf7OC0gtPpTQrFhoL29jkCobxtx90-UyUA8f1_3w"
});

clubs.push({
    name: "Minas Tênis Clube",
    url: "https://www.minastenisclube.com.br",
    adress: "Rua da Bahia, 2.244, Lourdes Belo Horizonte - MG - 30160 - 012",
    phone: "31 3516-1000",
    lat: -19.9312082,
    long: -43.941386,
    logo: "https://cdn.desapega.net/thumbs/cota-do-minas-tenis-clube_640x480_25_1a1c7636b5e4e935de186e33bf453e085cf03a61ac4600ff20910a2533863e.jpg"
});

clubs.push({
    name: "Anhembi Tênis Clube",
    url: "http://www.clubeanhembi.com.br/",
    adress: "Rua Alexandre Herculano, 2 CEP: 05464 - 020 - Alto de Pinheiros - SP",
    phone: "11 2142-0889",
    lat: -23.551098,
    long: -46.7178849,
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcpylpXZMgjIpVmoDBaoUpm0ejbVKQgFwL_tE8NtnE8VAXPKVl"
});

clubs.push({
    name: "Tênis Clube Paulista",
    url: "http://www.tenisclubepaulista.com.br/",
    adress: "Rua Gualaxos, 285 - Paraíso - CEP 01533 - 020 - São Paulo - SP",
    phone: "11 3252-5254",
    lat: -23.5725328,
    long: -46.6407597,
    logo: "http://www.tenisclubepaulista.com.br/wp-content/uploads/2015/11/TCP2.png"

});

clubs.push({
    name: "Esporte Clube Pinheiros",
    url: "http://www.ecp.org.br/",
    adress: "Rua Angelina Maffei Vita, 493 Jardim Europa São Paulo/SP CEP 01455 - 902",
    phone: "11 3598-9700",
    lat: -23.580241,
    long: -46.6931039,
    logo: "http://www.cursoforca.com.br/images/esporte-clube-pinheiros-refor%C3%A7o-escolar-for%C3%A7a-ensino-personalizado2.jpg?crc=166720045"
});

clubs.push({
    name: "Tênis Clube de Santos",
    url: "https://www.tcds.com.br/",
    adress: "Rua Minas Gerais, 37 – Boqueirão – Santos - SP",
    phone: "13 3228-8100",
    lat: -23.9684721,
    long: -46.3278571,
    logo: "https://pbs.twimg.com/profile_images/643490543939530755/2SSIAP2q_400x400.jpg"
});

clubs.push({
    name: "Praia Clube Uberlândia",
    url: "https://www.praiaclube.org.br",
    adress: "Praça Primo Crosara, 505, Copacabana,Uberlândia - MG, 38411 - 076, Brasil",
    phone: "34 3256-3100",
    lat: -18.9333199,
    long: -48.2937277,
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Logo_do_Praia_com_contorno_preto.png/1200px-Logo_do_Praia_com_contorno_preto.png",
});

clubs.push({
    name: "Pró MV Tênis",
    url: "http://www.promvtenis.com.br",
    adress: "Av.Rachel de Queiroz - Barra da Tijuca Rio de Janeiro - RJ",
    phone: "21 99614-3827",
    lat: -22.9924238,
    long: -43.3797053,
    logo: "https://i.pinimg.com/originals/c7/4c/a0/c74ca0c175a33cae2bde5954e38a74b8.png"
});

clubs.push({
    name: "Federação Gaúcha de Tênis",
    url: "http://www.tenisintegrado.com.br/",
    adress: "Rua Vigário José Inácio, 371 - Salas 522 e 523 - Cep 90020100 - Porto Alegre - RS",
    phone: "51 3226-5734",
    lat: -30.0289999,
    long: -51.228411,
    logo: "http://atc.esp.br/wp-content/uploads/2015/01/noticia1884.jpg"

});

clubs.push({
    name: "Federação Cearense de Tênis",
    url: "https://teniscearense.com.br/academia-cearense-de-tenis/",
    adress: "Av.Santos Dumont, 847 - 505 - Aldeota, Fortaleza - CE, 60150 - 161",
    phone: "85 98202-3232",
    lat: -3.7302771,
    long: -38.518117,
    logo: "http://torneios.teniscearense.com.br/imagens/fct-logo.png?pfdrid_c=true"
});


for (let i = 0; i < clubs.length; i++) {

    let Club = Parse.Object.extend("Club");
    let club = new Club();
    
    club.set("name", clubs[i].name);
    club.set("url", clubs[i].url);
    club.set("adress", clubs[i].adress);
    club.set("phone", clubs[i].phone);
    club.set("logo", clubs[i].logo);
    club.set("location", new Parse.GeoPoint({
         latitude: clubs[i].lat,
         longitude: clubs[i].long
     }));

    club.save();
}

