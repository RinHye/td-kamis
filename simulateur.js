const relationsElement = {
  eau: "feu",
  feu: "feuille",
  feuille: "eau"
};

function getCoeffElementaire(elementAttaquant, elementCible) {
  if (elementAttaquant === elementCible) return 1.0;
  if (relationsElement[elementAttaquant] === elementCible) return 1.2;
  return 0.8;
}

function getPuissanceFinale(puissanceEquipe, puissanceMain, elementAttaquant, elementCible) {
  const coeff = getCoeffElementaire(elementAttaquant, elementCible);
  return puissanceEquipe - puissanceMain + puissanceMain * coeff;
}

function calcDebuff(puissanceFinale, puissanceCible) {
  const res = (1 - puissanceFinale / puissanceCible) * 100;
  return res < 0 ? 0 : res;
}

function getNbKo(debuff) {
  const nbKo = 4.4383 * debuff + 1.3608;
  return nbKo < 0 ? 0 : nbKo;
}

function getNbEquipes(nbKo, nbMembre) {
  return nbKo > 0 ? Math.ceil(nbKo / nbMembre) : 0;
}

function simulateFight(joueur, ennemi) {
  const puissanceFinale = getPuissanceFinale(joueur.puissance, joueur.puissanceMain, joueur.element, ennemi.element);
  const debuff = calcDebuff(puissanceFinale, ennemi.puissance);
  const nbKo = getNbKo(debuff);
  const nbEquipes = getNbEquipes(nbKo, joueur.nbMembre);
  const margeErreur = Math.ceil(nbKo + 20);

  return {
    joueur: joueur.pseudo,
    ennemi: ennemi.pseudo,
    nbKo: Math.ceil(nbKo),
    nbEquipes,
    margeErreur
  };
}

function createOptionList(containerId, list, isJoueur) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  list.forEach((item) => {
    const btn = document.createElement("button");
    btn.textContent = `${item.pseudo} (${item.element})`;
    btn.className = "select-button";
    btn.type = "button";
    btn.addEventListener("click", () => {
      document.querySelectorAll(`#${containerId} .select-button`).forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      if (isJoueur) window.selectedJoueur = item;
      else window.selectedEnnemi = item;
    });
    container.appendChild(btn);
  });
}

function afficherResultats() {
  if (!window.selectedJoueur || !window.selectedEnnemi) {
    alert("Merci de sélectionner une équipe joueur ET une équipe ennemie !");
    return;
  }
  const resultats = simulateFight(window.selectedJoueur, window.selectedEnnemi);
  const output = document.getElementById("output");
  output.innerHTML = `
    <h3>Combat : ${resultats.joueur} VS ${resultats.ennemi}</h3>
    <p><strong>Nombre de KO nécessaire :</strong> ${resultats.nbKo}</p>
    <p><strong>Nombre d'équipes nécessaires :</strong> ${resultats.nbEquipes}</p>
    <p><strong>Marge d'erreur +20 :</strong> ${resultats.margeErreur}</p>
  `;
}

const joueurs = [
  { pseudo: "Rin", puissance: 31317255, element: "feuille", puissanceMain: 18109647, nbMembre: 6 },
  { pseudo: "Goma", puissance: 24956617, element: "feuille", puissanceMain: 16709083, nbMembre: 6 },
  { pseudo: "Elokyo", puissance: 16148641, element: "feu", puissanceMain: 10344491, nbMembre: 6 },
  { pseudo: "Yoru", puissance: 18595483, element: "eau", puissanceMain: 8073182, nbMembre: 6 },
  { pseudo: "Asti", puissance: 16849173, element: "feu", puissanceMain: 8624793, nbMembre: 6 },
  { pseudo: "Linouille", puissance: 14393352, element: "eau", puissanceMain: 9645915, nbMembre: 6 },
  { pseudo: "El", puissance: 13380488, element: "feuille", puissanceMain: 9657559, nbMembre: 6 },
  { pseudo: "Kooks", puissance: 12548272, element: "eau", puissanceMain: 7721455, nbMembre: 6 },
  { pseudo: "YangireEau", puissance: 14038460, element: "eau", puissanceMain: 5893450, nbMembre: 6 },
  { pseudo: "Motte", puissance: 11778499, element: "feu", puissanceMain: 6056093, nbMembre: 6 },
  { pseudo: "Airi", puissance: 11269777, element: "feu", puissanceMain: 5188452, nbMembre: 6 },
  { pseudo: "chloee", puissance: 10771918, element: "feu", puissanceMain: 7069572, nbMembre: 6 },
  { pseudo: "Evednie", puissance: 10373533, element: "feu", puissanceMain: 5878067, nbMembre: 6 },
  { pseudo: "Aria", puissance: 9106326, element: "feu", puissanceMain: 3017793, nbMembre: 6 },
  { pseudo: "Healu", puissance: 5853106, element: "feu", puissanceMain: 5050603, nbMembre: 6 },
  { pseudo: "Alexandra76", puissance: 6843700, element: "feu", puissanceMain: 4134498, nbMembre: 6 },
  { pseudo: "Teddy", puissance: 5488418, element: "feu", puissanceMain: 1795442, nbMembre: 6 },
  { pseudo: "Eclipse", puissance: 2863933, element: "eau", puissanceMain: 1895888, nbMembre: 6 },
  { pseudo: "Inari", puissance: 2320883, element: "eau", puissanceMain: 1143205, nbMembre: 6 },
  { pseudo: "Marrouf", puissance: 2302923, element: "eau", puissanceMain: 1089819, nbMembre: 6 }
];

const ennemis = [
  { pseudo: "ares", puissance: 25131906, element: "eau" },
  { pseudo: "Jade", puissance: 23341765, element: "eau" },
  { pseudo: "Tsubasa hanae", puissance: 19339056, element: "feu" },
  { pseudo: "Devlin", puissance: 17067007, element: "feuille" },
  { pseudo: "Zhao Yunlan", puissance: 10386108 + 5067970 + 591461 + 408430 + 170739 + 122041, element: "feu" },

  { pseudo: "Anya", puissance: 16302494, element: "feu" },

  { pseudo: "YumejiTM", puissance: 8739795 + 4552569 + 1521903 + 907120 + 298680 + 107065, element: "eau" },
  { pseudo: "Gojo", puissance: 11074737 + 762569 + 2137501 + 324572 + 299050 + 262610, element: "feuille" },
  { pseudo: "Taiga Hoshibami", puissance: 10224196 + 3451899 + 647524 + 565399 + 357480 + 251057, element: "feuille" },
  { pseudo: "Meer", puissance: 9174115, element: "eau" },
  { pseudo: "Affellia Light", puissance: 14618444, element: "eau" },

  { pseudo: "Madame Lexie", puissance: 14749317, element: "eau" },
  { pseudo: "fuyu", puissance: 13949428, element: "feuille" },
  { pseudo: "Madden", puissance: 6400990 + 5775904 + 863088 + 142039 + 129686 + 66338, element: "eau" },
  { pseudo: "Alana", puissance: 11491543, element: "eau" },
  { pseudo: "Mr.Scarletella", puissance: 8791442 + 1558141 + 574910 + 371056 + 80782 + 62312, element: "feuille" },

  { pseudo: "Yuka", puissance: 10726683, element: "eau" },
  { pseudo: "Luna-Terra", puissance: 6619095 + 893682 + 295479 + 268545 + 267424 + 202262, element: "feu" },
  { pseudo: "jade:3", puissance: 10636463, element: "feuille" },
  { pseudo: "Aria", puissance: 9697723, element: "feuille" },
  { pseudo: "Akira", puissance: 8222743, element: "feu" },

  { pseudo: "j", puissance: 6806681, element: "feu" },
  { pseudo: "ronin", puissance: 7937578, element: "feu" },
  { pseudo: "Personne", puissance: 9188391, element: "feu" },
  { pseudo: "call.us.angel", puissance: 5033258 + 3395647 + 140431 + 100311 + 65022 + 65169, element: "feuille" },
  { pseudo: "Rosalin", puissance: 7828113 - 161532 + 212231, element: "feu" }
];

document.addEventListener("DOMContentLoaded", () => {
  createOptionList("joueursList", joueurs, true);
  createOptionList("ennemisList", ennemis, false);

  const btn = document.getElementById("btnCalculer");
  btn.addEventListener("click", afficherResultats);
});
