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

function simulationCombat(joueur, ennemi) {
  const puissanceFinale = getPuissanceFinale(joueur.puissance, joueur.puissanceMain, joueur.element, ennemi.element);
  const debuff = calcDebuff(puissanceFinale, ennemi.puissance);
  const nbKo = getNbKo(debuff);
  const nbEquipes = getNbEquipes(nbKo, joueur.nbMembre);
  const margeErreur = getMargeErreur(nbKo, joueur, ennemi);

  return {
    joueur: joueur.pseudo,
    ennemi: ennemi.pseudo,
    nbKoBrut: Math.ceil(nbKo),
    nbKoFinal: Math.ceil(Math.ceil(nbKo) + margeErreur),
    margeErreur,
    nbEquipes,
    nbEquipesFinal: Math.ceil((Math.ceil(nbKo) + margeErreur) / joueur.nbMembre)
  };
}

function getMargeErreur(nbKo, joueur, ennemi) {
  const diffPuissance = Math.abs(joueur.puissance - ennemi.puissance);
  const ratioIncertain = diffPuissance / ennemi.puissance;

  const coeffElem = getCoeffElementaire(joueur.element, ennemi.element);

  // Pondération selon élément :
  let facteurElement;
  if (coeffElem > 1.0) facteurElement = 0.8;
  else if (coeffElem < 1.0) facteurElement = 1.2;
  else facteurElement = 1.0;

  // Base + incertitude
  const base = nbKo * 0.1;
  const incertitude = nbKo * ratioIncertain * 0.5;

  const marge = (base + incertitude) * facteurElement;

  return Math.ceil(Math.min(Math.max(marge, 1), 25));
}

function createOptionList(containerId, list, isJoueur) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  list.forEach((item) => {
    const btn = document.createElement("button");
    // Créer l'étiquette pour l'élément
    let etiquetteClass = "etiquette";
    if (item.element === "feu") {
      etiquetteClass += " etiquette-feu";
    } else if (item.element === "eau") {
      etiquetteClass += " etiquette-eau";
    } else if (item.element === "feuille") {
      etiquetteClass += " etiquette-feuille";
    }
    
    btn.innerHTML = 
    `<div class="nom-et-element">
        <span class="bold">${item.pseudo}</span>
        <div class="${etiquetteClass}">${item.element}</div>
    </div>
    <div>
      <span class="bold">Puissance : </span>${item.puissance}
    </div>`;
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
  const resultats = simulationCombat(window.selectedJoueur, window.selectedEnnemi);
  const output = document.getElementById("output");
  output.innerHTML = `
    <h3>Combat : ${resultats.joueur} VS ${resultats.ennemi}</h3>
    <p><strong>KO nécessaires brut :</strong> ${resultats.nbKoBrut}</p>
    <p><strong>Marge d'erreur :</strong> ${resultats.margeErreur}</p>
    <p><strong>Nb KO avec marge :</strong> ${resultats.nbKoFinal}</p>
    <p><strong>Nb d'équipes brut :</strong> ${resultats.nbEquipes}</p>
    <p><strong>Nb d'équipes avec marge :</strong> ${resultats.nbEquipesFinal}</p>
    <small><i>Une équipe complète est composée de 6 personnes, soit 6 KO</i></small>
  `;
}

// Fonction pour charger les données du Google Sheets
async function chargerJoueursDepuisSheets() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTEMMJK57wJeclZwYw8ayCOhO9hx8uMpIbLKadj7axvVCWR_x18N6F9BwQDt7LgZA/pub?gid=955213893&single=true&output=csv";
  
  try {
    const response = await fetch(url);
    const csvText = await response.text();
    
    const lignes = csvText.split('\n');
    const joueurs = [];
    
    // Ignorer la première ligne (headers) et traiter les autres
    for (let i = 1; i < lignes.length; i++) {
      const ligne = lignes[i].trim();
      
      // Sauter les lignes vides
      if (!ligne) continue;
      
      const colonnes = ligne.split(',');
      
      // Vérifier qu'on a au moins 4 colonnes et que les données ne sont pas vides
      if (colonnes.length >= 4 && colonnes[0].trim() && colonnes[1].trim() && colonnes[2].trim() && colonnes[3].trim()) {
        const pseudo = colonnes[0].trim().replace(/"/g, ''); // Enlever les guillemets si présents
        const puissance = parseInt(colonnes[1].trim().replace(/"/g, ''));
        const puissanceMain = parseInt(colonnes[2].trim().replace(/"/g, ''));
        const element = colonnes[3].trim().replace(/"/g, '').toLowerCase();
        
        // Vérifier que les puissances sont des nombres valides
        if (!isNaN(puissance) && !isNaN(puissanceMain) && pseudo && element) {
          joueurs.push({
            pseudo: pseudo,
            puissance: puissance,
            element: element,
            puissanceMain: puissanceMain,
            nbMembre: 6
          });
        }
      }
    }
    
    return joueurs;
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    alert("Erreur lors du chargement des données du Google Sheets. Utilisation des données par défaut.");
    return getJoueursParDefaut();
  }
}

// Données par défaut en cas d'erreur
function getJoueursParDefaut() {
  return [
    { pseudo: "Rin", puissance: 31842693, element: "feuille", puissanceMain: 18211871, nbMembre: 6 },
    { pseudo: "Goma", puissance: 25227318, element: "feuille", puissanceMain: 16848520, nbMembre: 6 },
    { pseudo: "Elokyo", puissance: 16223932, element: "feu", puissanceMain: 10373294, nbMembre: 6 },
    { pseudo: "Yoru", puissance: 18625638, element: "eau", puissanceMain: 8103337, nbMembre: 6 },
    { pseudo: "Asti", puissance: 17489922, element: "feu", puissanceMain: 8656855, nbMembre: 6 },
    { pseudo: "Linouille", puissance: 14481143, element: "eau", puissanceMain: 9693514, nbMembre: 6 },
    { pseudo: "El", puissance: 13433882, element: "feuille", puissanceMain: 9676477, nbMembre: 6 },
    { pseudo: "Kooks", puissance: 12548272, element: "eau", puissanceMain: 7721455, nbMembre: 6 },
    { pseudo: "YangireEau", puissance: 14154922, element: "eau", puissanceMain: 5971452, nbMembre: 6 },
    { pseudo: "Motte", puissance: 11801210, element: "feu", puissanceMain: 6062788, nbMembre: 6 }
  ];
}

// Données ennemis (gardées en brut comme demandé)
const ennemis = [
  { pseudo: "ares", puissance: 25439923, element: "eau" },
  { pseudo: "Jade", puissance: 23641875, element: "eau" },
  { pseudo: "Tsubasa hanae", puissance: 19538495, element: "feu" },
  { pseudo: "Devlin", puissance: 17145599, element: "feuille" },
  { pseudo: "Zhao Yunlan", puissance: 10386108 + 5067970 + 591461 + 408430 + 170739 + 122041, element: "feu" },//

  { pseudo: "Anya", puissance: 16462354, element: "feu" },

  { pseudo: "YumejiTM", puissance: 8739795 + 4552569 + 1521903 + 907120 + 298680 + 107065, element: "eau" },//
  { pseudo: "Gojo", puissance: 15086233, element: "feuille" },
  { pseudo: "Taiga Hoshibami", puissance: 10224196 + 3451899 + 647524 + 565399 + 357480 + 251057, element: "feuille" },//
  { pseudo: "Meer", puissance: 14145102, element: "eau" },
  { pseudo: "Affellia Light", puissance: 14727803, element: "eau" },

  { pseudo: "Madame Lexie", puissance: 14919300, element: "eau" },
  { pseudo: "fuyu", puissance: 14045663, element: "feuille" },
  { pseudo: "Madden", puissance: 6400990 + 5775904 + 863088 + 142039 + 129686 + 66338, element: "eau" },//
  { pseudo: "Alana", puissance: 11697443, element: "eau" },
  { pseudo: "Mr.Scarletella", puissance: 8791442 + 1558141 + 574910 + 371056 + 80782 + 62312, element: "feuille" },//

  { pseudo: "Yuka", puissance: 10767518, element: "eau" },
  { pseudo: "Luna-Terra", puissance: 6619095 + 893682 + 295479 + 268545 + 267424 + 202262, element: "feu" },//
  { pseudo: "jade:3", puissance: 10927309, element: "feuille" },
  { pseudo: "Aria", puissance: 9884378, element: "feuille" },
  { pseudo: "Akira", puissance: 8281030, element: "feu" },

  { pseudo: "j", puissance: 6835508, element: "feu" },
  { pseudo: "ronin", puissance: 8279934, element: "feu" },
  { pseudo: "Personne", puissance: 9215098, element: "feu" },
  { pseudo: "call.us.angel", puissance: 5033258 + 3395647 + 140431 + 100311 + 65022 + 65169, element: "feuille" },//
  { pseudo: "Rosalin", puissance: 7828113 - 161532 + 212231, element: "feu" }//
];

document.addEventListener("DOMContentLoaded", async () => {
  // Charger les joueurs depuis Google Sheets
  const joueurs = await chargerJoueursDepuisSheets();
  
  createOptionList("joueursList", joueurs, true);
  createOptionList("ennemisList", ennemis, false);

  const btn = document.getElementById("btnCalculer");
  btn.addEventListener("click", afficherResultats);
  const toggleArrow = document.getElementById("toggleArrow");

  toggleArrow.addEventListener("click", () => {
    contentRes.classList.toggle("collapsed");

    // Faire tourner l'icône (↑ ou ↓)
    const icon = toggleArrow.querySelector("i");
    icon.classList.toggle("fa-chevron-down");
    icon.classList.toggle("fa-chevron-up");
  });
});

window.addEventListener('scroll', function() {
  const div = document.getElementById('resDiv');

  // Option : déclenchement quand on a scrollé de 100px ou plus
  if (window.scrollY > 300) {
    div.classList.add('active');
  } else {
    div.classList.remove('active');
  }
});