const relationsElement = {
  eau: "feu",
  feu: "feuille",
  feuille: "eau"
};

const urlGuilde = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTEMMJK57wJeclZwYw8ayCOhO9hx8uMpIbLKadj7axvVCWR_x18N6F9BwQDt7LgZA/pub?gid=955213893&single=true&output=csv";
const urlAdverse = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTEMMJK57wJeclZwYw8ayCOhO9hx8uMpIbLKadj7axvVCWR_x18N6F9BwQDt7LgZA/pub?gid=184683018&single=true&output=csv";
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
  const puissanceFinaleJoueur = getPuissanceFinale(joueur.puissance, joueur.puissanceMain, joueur.element, ennemi.element);
  const puissanceFinaleEnnemi = getPuissanceFinale(ennemi.puissance, ennemi.puissanceMain, ennemi.element, joueur.element);
  const debuff = calcDebuff(puissanceFinaleJoueur, puissanceFinaleEnnemi);
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
  // Calculer les puissances finales pour obtenir les vraies puissances effectives
  const puissanceFinaleJoueur = getPuissanceFinale(joueur.puissance, joueur.puissanceMain, joueur.element, ennemi.element);
  const puissanceFinaleEnnemi = getPuissanceFinale(ennemi.puissance, ennemi.puissanceMain, ennemi.element, joueur.element);
  
  const diffPuissance = Math.abs(puissanceFinaleJoueur - puissanceFinaleEnnemi);
  const ratioIncertain = diffPuissance / puissanceFinaleEnnemi;

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
    <p><strong>Nb KO brut :</strong> ${resultats.nbKoBrut}</p>
    <p><strong>Nb KO avec marge :</strong> ${resultats.nbKoFinal}</p>
    <hr>
    <p><strong>Nb d'équipes brut :</strong> ${resultats.nbEquipes}</p>
    <p><strong>Nb d'équipes avec marge :</strong> ${resultats.nbEquipesFinal}</p>
    <small><i>Une équipe complète est composée de 6 personnes, soit 6 KO</i></small>
  `;
  //    <p><strong>Marge d'erreur :</strong> ${resultats.margeErreur}</p>

}

// Fonction pour charger les données du Google Sheets - Joueurs (Forces guilde)
async function chargerJoueursDepuisSheets(isInverted = false) {
  const url = isInverted ? urlAdverse : urlGuilde;
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
    console.error("Erreur lors du chargement des données joueurs:", error);
    alert("Erreur lors du chargement des données des joueurs du Google Sheets. Utilisation des données par défaut.");
    return getJoueursParDefaut();
  }
}

// Fonction pour charger les ennemis depuis Google Sheets - Ennemis (Forces ennemis)
async function chargerEnnemisDepuisSheets(isInverted = false) {
  const url = isInverted ? urlGuilde : urlAdverse;
  
  try {
    const response = await fetch(url);
    const csvText = await response.text();
    
    const lignes = csvText.split('\n');
    const ennemis = [];
    
    // Ignorer la première ligne (headers) et traiter les autres
    for (let i = 1; i < lignes.length; i++) {
      const ligne = lignes[i].trim();
      
      // Sauter les lignes vides
      if (!ligne) continue;
      
      const colonnes = ligne.split(',');
      
      // Vérifier qu'on a au moins 4 colonnes et que les données ne sont pas vides
      // Colonnes : Pseudo, Puissance totale, Puissance Main, Elément du main
      if (colonnes.length >= 4 && colonnes[0].trim() && colonnes[1].trim() && colonnes[2].trim() && colonnes[3].trim()) {
        const pseudo = colonnes[0].trim().replace(/"/g, ''); // Enlever les guillemets si présents
        const puissance = parseInt(colonnes[1].trim().replace(/"/g, ''));
        const puissanceMain = parseInt(colonnes[2].trim().replace(/"/g, ''));
        const element = colonnes[3].trim().replace(/"/g, '').toLowerCase();
        
        // Vérifier que les puissances sont des nombres valides
        if (!isNaN(puissance) && !isNaN(puissanceMain) && pseudo && element) {
          ennemis.push({
            pseudo: pseudo,
            puissance: puissance,
            element: element,
            puissanceMain: puissanceMain
          });
        }
      }
    }
    
    return ennemis;
  } catch (error) {
    console.error("Erreur lors du chargement des données ennemis:", error);
    alert("Erreur lors du chargement des données des ennemis du Google Sheets. Utilisation des données par défaut.");
    return getEnnemisParDefaut();
  }
}

// Données par défaut en cas d'erreur - Joueurs
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

// Données par défaut en cas d'erreur - Ennemis
function getEnnemisParDefaut() {
  return [
    { pseudo: "ares", puissance: 25439923, element: "eau", puissanceMain: 15000000 },
    { pseudo: "Jade", puissance: 23641875, element: "eau", puissanceMain: 14000000 },
    { pseudo: "Tsubasa hanae", puissance: 19538495, element: "feu", puissanceMain: 12000000 },
    { pseudo: "Devlin", puissance: 17145599, element: "feuille", puissanceMain: 10000000 },
    { pseudo: "Zhao Yunlan", puissance: 10386108 + 5067970 + 591461 + 408430 + 170739 + 122041, element: "feu", puissanceMain: 10386108 },
    { pseudo: "Anya", puissance: 16462354, element: "feu", puissanceMain: 9500000 },
    { pseudo: "YumejiTM", puissance: 8739795 + 4552569 + 1521903 + 907120 + 298680 + 107065, element: "eau", puissanceMain: 8739795 },
    { pseudo: "Gojo", puissance: 15086233, element: "feuille", puissanceMain: 9000000 },
    { pseudo: "Taiga Hoshibami", puissance: 10224196 + 3451899 + 647524 + 565399 + 357480 + 251057, element: "feuille", puissanceMain: 10224196 },
    { pseudo: "Meer", puissance: 14145102, element: "eau", puissanceMain: 8500000 },
    { pseudo: "Affellia Light", puissance: 14727803, element: "eau", puissanceMain: 8800000 },
    { pseudo: "Madame Lexie", puissance: 14919300, element: "eau", puissanceMain: 8900000 },
    { pseudo: "fuyu", puissance: 14045663, element: "feuille", puissanceMain: 8400000 },
    { pseudo: "Madden", puissance: 6400990 + 5775904 + 863088 + 142039 + 129686 + 66338, element: "eau", puissanceMain: 6400990 },
    { pseudo: "Alana", puissance: 11697443, element: "eau", puissanceMain: 7000000 },
    { pseudo: "Mr.Scarletella", puissance: 8791442 + 1558141 + 574910 + 371056 + 80782 + 62312, element: "feuille", puissanceMain: 8791442 },
    { pseudo: "Yuka", puissance: 10767518, element: "eau", puissanceMain: 6500000 },
    { pseudo: "Luna-Terra", puissance: 6619095 + 893682 + 295479 + 268545 + 267424 + 202262, element: "feu", puissanceMain: 6619095 },
    { pseudo: "jade:3", puissance: 10927309, element: "feuille", puissanceMain: 6600000 },
    { pseudo: "Aria", puissance: 9884378, element: "feuille", puissanceMain: 6000000 },
    { pseudo: "Akira", puissance: 8281030, element: "feu", puissanceMain: 5000000 },
    { pseudo: "j", puissance: 6835508, element: "feu", puissanceMain: 4100000 },
    { pseudo: "ronin", puissance: 8279934, element: "feu", puissanceMain: 5000000 },
    { pseudo: "Personne", puissance: 9215098, element: "feu", puissanceMain: 5500000 },
    { pseudo: "call.us.angel", puissance: 5033258 + 3395647 + 140431 + 100311 + 65022 + 65169, element: "feuille", puissanceMain: 5033258 },
    { pseudo: "Rosalin", puissance: 7828113 - 161532 + 212231, element: "feu", puissanceMain: 4700000 }
  ];
}

// Feature de recherche
// Variables globales pour stocker les listes complètes
let joueursComplets = [];
let ennemisComplets = [];

// Fonction de recherche pour filtrer les listes
function search() {
  const pseudoInput = document.getElementById("pseudo");
  const pseudoAdversaireInput = document.getElementById("pseudoAdversaire");
  
  // Filtrer les joueurs si l'input pseudo a changé
  if (pseudoInput && document.activeElement === pseudoInput) {
    const searchTerm = pseudoInput.value.toLowerCase().trim();
    const joueursFiltres = joueursComplets.filter(joueur => 
      joueur.pseudo.toLowerCase().includes(searchTerm)
    );
    createOptionList("joueursList", joueursFiltres, true);
  }
  
  // Filtrer les ennemis si l'input pseudoAdversaire a changé
  if (pseudoAdversaireInput && document.activeElement === pseudoAdversaireInput) {
    const searchTerm = pseudoAdversaireInput.value.toLowerCase().trim();
    const ennemisFiltres = ennemisComplets.filter(ennemi => 
      ennemi.pseudo.toLowerCase().includes(searchTerm)
    );
    createOptionList("ennemisList", ennemisFiltres, false);
  }
}

// Fonction améliorée pour gérer la recherche en temps réel
function setupSearchListeners() {
  const pseudoInput = document.getElementById("pseudo");
  const pseudoAdversaireInput = document.getElementById("pseudoAdversaire");
  
  // Gestionnaire pour la recherche d'équipes
  if (pseudoInput) {
    pseudoInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase().trim();
      const joueursFiltres = joueursComplets.filter(joueur => 
        joueur.pseudo.toLowerCase().includes(searchTerm)
      );
      createOptionList("joueursList", joueursFiltres, true);
    });
    
    // Réinitialiser la liste quand le champ est vidé
    pseudoInput.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        createOptionList("joueursList", joueursComplets, true);
      }
    });
  }
  
  // Gestionnaire pour la recherche d'adversaires
  if (pseudoAdversaireInput) {
    pseudoAdversaireInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase().trim();
      const ennemisFiltres = ennemisComplets.filter(ennemi => 
        ennemi.pseudo.toLowerCase().includes(searchTerm)
      );
      createOptionList("ennemisList", ennemisFiltres, false);
    });
    
    // Réinitialiser la liste quand le champ est vidé
    pseudoAdversaireInput.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        createOptionList("ennemisList", ennemisComplets, false);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname;
  const isInverted = path.endsWith("/invert.html");
  // Charger les joueurs et ennemis depuis Google Sheets
  
  joueursComplets = await chargerJoueursDepuisSheets(isInverted);
  ennemisComplets = await chargerEnnemisDepuisSheets(isInverted);
  
  // Créer les listes initiales
  createOptionList("joueursList", joueursComplets, true);
  createOptionList("ennemisList", ennemisComplets, false);
  
  // Configurer les listeners de recherche
  setupSearchListeners();

  const btn = document.getElementById("btnCalculer");
  btn.addEventListener("click", afficherResultats);
  
  const toggleArrow = document.getElementById("toggleArrow");
  const contentRes = document.getElementById("contentRes");

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