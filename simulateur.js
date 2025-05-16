// simulateur.js avec interface web simple

// Relations de forces élémentaires
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
  
  // Interface web basique
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("fightForm");
    const output = document.getElementById("output");
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const joueur = {
        pseudo: document.getElementById("joueurNom").value,
        puissance: parseInt(document.getElementById("joueurPuissance").value),
        element: document.getElementById("joueurElement").value,
        puissanceMain: parseInt(document.getElementById("joueurMain").value),
        nbMembre: parseInt(document.getElementById("joueurMembres").value)
      };
  
      const ennemi = {
        pseudo: document.getElementById("ennemiNom").value,
        puissance: parseInt(document.getElementById("ennemiPuissance").value),
        element: document.getElementById("ennemiElement").value
      };
  
      const resultats = simulateFight(joueur, ennemi);
  
      output.innerHTML = `
        <h3>Combat : ${resultats.joueur} VS ${resultats.ennemi}</h3>
        <p><strong>Nombre de KO nécessaire :</strong> ${resultats.nbKo}</p>
        <p><strong>Nombre d'équipes nécessaires :</strong> ${resultats.nbEquipes}</p>
        <p><strong>Marge d'erreur 20 :</strong> ${resultats.margeErreur}</p>
      `;
    });
  });
document.addEventListener("DOMContentLoaded", () => {
  createOptionList("joueursList", joueurs, true);
  createOptionList("ennemisList", ennemis, false);

  document.getElementById("calculer").addEventListener("click", () => {
    checkAndSimulate();
  });
});
function checkAndSimulate() {
  const output = document.getElementById("output");
  if (window.selectedJoueur && window.selectedEnnemi) {
    const resultats = simulateFight(window.selectedJoueur, window.selectedEnnemi);
    output.innerHTML = `
      <h3>Combat : ${resultats.joueur} VS ${resultats.ennemi}</h3>
      <p><strong>Nombre de KO nécessaire :</strong> ${resultats.nbKo}</p>
      <p><strong>Nombre d'équipes nécessaires :</strong> ${resultats.nbEquipes}</p>
      <p><strong>Marge d'erreur 20 :</strong> ${resultats.margeErreur}</p>
    `;
  } else {
    output.innerHTML = "<p>Veuillez sélectionner un joueur et un ennemi avant de lancer le calcul.</p>";
  }
}
