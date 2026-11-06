
// ===========================================================================
// 1. CONFIGURATION GLOBAL ET VARIABLES D'ÉTAT
// ===========================================================================
const GAS_EXEC_URL = "https://script.google.com/macros/s/AKfycby1o-XBM2w5F0ZiZZfzsBXvV04tmTTjoIqUhaSZNuRTwSMi0c6mg1W0DN6QYoCLq0JB/exec";

let nbActiviteS = 0;
let nbActiviteL = 0;   
let nomActivitesSportives = [];
let nomActivitesLoisirs = [];
let nbOptions = 0;
let optionsFFRP = [];
let memberData = null; 

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
const sectionValidators = {};

// ===========================================================================
// 2. CHARGEMENT ASYNCHRONE DES DONNÉES (API GET)
// ===========================================================================
async function chargerDonneesEtInitialiser() {

  // console.log("👉 Token extrait de l'URL :", token); // 1. Vérifier si le token est capturé
  afficherMessageInfo('⌛ Recherche de vos données de l\'année dernière...', 'info', 'section-1-personnelles');

  if (token) {
    try { 
      const res = await fetch(`${GAS_EXEC_URL}?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      // console.log("👉 Réponse JSON de Apps Script :", json);
      memberData = json.memberData;
      nbActiviteS = json.config.nbActiviteS;
      nbActiviteL = json.config.nbActiviteL;
      nomActivitesSportives = json.config.nomActivitesSportives;
      nomActivitesLoisirs = json.config.nomActivitesLoisirs;
      nbOptions = json.config.nbOptions;
      optionsFFRP = json.config.optionsFFRP;
    } catch (err) {
      console.error("Erreur de chargement des données :", err);
    }
  } 
  initFormulaire();
}

// ===========================================================================
// 3. FONCTIONS UTILITAIRES DE VALIDATION ET RENDU
// ===========================================================================
/**
 * Affiche ou met à jour un message d'information dans un conteneur cible
 * @param {string} htmlMessage - Le contenu HTML ou texte du message
 * @param {string} type - 'info' (bleu, défaut) ou 'warning' (jaune)
 * @param {string} targetContainerId - L'ID de l'élément parent
 */
function afficherMessageInfo(htmlMessage, type = 'info', targetContainerId = 'section-1-personnelles') {
  let infoMessageEl = document.getElementById('info-message-preremplissage');

  if (!infoMessageEl) {
    infoMessageEl = document.createElement('div');
    infoMessageEl.id = 'info-message-preremplissage';
    
    const container = document.getElementById(targetContainerId) || document.getElementById('adhesion-form');
    if (container) {
      container.insertBefore(infoMessageEl, container.firstChild);
    }
  }

  if (type === 'warning') {
    infoMessageEl.style.cssText = 'background-color: #fff3cd; color: #664d03; padding: 12px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #ffc107;';
  } else {
    infoMessageEl.style.cssText = 'background-color: #cfe2ff; color: #084298; padding: 12px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #0d6efd;';
  }

  infoMessageEl.innerHTML = htmlMessage;
}
function isElementVisible(el) {
  return !!(el && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0));
}

function isSectionValid(section) {
  if (!section) return true;

  const requiredInputs = section.querySelectorAll(
    'input[required]:not([type="checkbox"]):not([type="radio"]), ' +
    'input[data-required="true"]:not([type="checkbox"]):not([type="radio"]), ' +
    'select[required], ' +
    'select[data-required="true"], ' +
    'textarea[required], ' +
    'textarea[data-required="true"]'
  );
 
  for (const input of requiredInputs) {
    if (isElementVisible(input) && !input.value.trim()) {
      return false;
    }
  }

  const radioGroups = new Set();
  section.querySelectorAll('input[type="radio"][data-required="true"], input[type="radio"][required]').forEach(radio => {
    if (isElementVisible(radio)) {
      radioGroups.add(radio.name);
    }
  });

  for (const groupName of radioGroups) {
    const checked = section.querySelector(`input[type="radio"][name="${groupName}"]:checked`);
    if (!checked) return false;
  }

  const requiredCheckboxes = section.querySelectorAll('input[type="checkbox"][data-required="true"], input[type="checkbox"][required]');
  for (const cb of requiredCheckboxes) {
    if (isElementVisible(cb) && !cb.checked) return false;
  }

  const checkboxGroups = section.querySelectorAll('[data-required-checkboxes]');
  for (const group of checkboxGroups) {
    if (isElementVisible(group)) {
      const checkedCount = group.querySelectorAll('input[type="checkbox"]:checked').length;
      if (checkedCount === 0) return false;
    }
  }
  return true;
}

function setButtonState(btn, isValid) {
  if (!btn) return;
  btn.disabled = !isValid;
  btn.style.opacity = isValid ? '1' : '0.5';
  btn.style.cursor = isValid ? 'pointer' : 'not-allowed';

  if (isValid) {
    btn.classList.remove('disabled');
  } else {
    btn.classList.add('disabled');
  }
}

function setupSectionValidation(sectionId, buttonId) {
  const section = document.getElementById(sectionId);
  const button = document.getElementById(buttonId);
  if (!section || !button) return;

  const updateState = () => {
    if (getComputedStyle(section).display === 'none') {
      setButtonState(button, false);
      return;
    }
    const valid = isSectionValid(section);
    setButtonState(button, valid);
  };

  sectionValidators[sectionId] = updateState;
  section.addEventListener('input', updateState);
  section.addEventListener('change', updateState);
  updateState();
}

function renderActivityCheckboxes() {
  const sportContainer = document.getElementById('activites-sportives-container');
  if (sportContainer) {
    sportContainer.innerHTML = '';
    nomActivitesSportives.forEach((nom, index) => {
      const id = `multi-activite-sportive-${index + 1}`;
      const div = document.createElement('div');
      div.className = 'col-1-3';
      div.innerHTML = `
        <label for="${id}" class="checkbox">
          <input id="${id}" name="${id}" type="checkbox" value="Oui" />
          ${nom}
        </label>
      `;
      sportContainer.appendChild(div);
    });
  }

  const loisirsContainer = document.getElementById('activites-loisirs-container');
  if (loisirsContainer) {
    loisirsContainer.innerHTML = '';
    nomActivitesLoisirs.forEach((nom, index) => {
      const id = `multi-activite-loisir-${index + 1}`;
      const div = document.createElement('div');
      div.className = 'col-1-3';
      div.innerHTML = `
        <label for="${id}" class="checkbox">
          <input id="${id}" name="${id}" type="checkbox" value="Oui" />
          ${nom}
        </label>
      `;
      loisirsContainer.appendChild(div);
    });
  }
}

function renderFfrpDropdown() {
  const container = document.getElementById('ffrp-dropdown-container');
  if (!container) return;

  let html = '<div class="control-group">';
  html += '<label for="multi-ffrp-option">Options FFRP et Assurance (*)</label>';
  html += '<select id="multi-ffrp-option" name="multi-ffrp-option" data-required="true" style="width: 100%; max-width: 500px;">';
  html += '<option value="" disabled selected>-- Veuillez choisir une option d\'adhésion --</option>';

  optionsFFRP.forEach((optionText) => {
    html += `<option value="${optionText}">${optionText}</option>`;
  });

  html += '</select></div>';
  container.innerHTML = html;

  const select = document.getElementById('multi-ffrp-option');
  if (select) {
    select.addEventListener('change', function() {
      updateFfrpMessage();
    });
  }
}

function updateFfrpMessage() {
  const messageContainer = document.getElementById('ffrp-instruction-message');
  const select = document.getElementById('multi-ffrp-option');
  if (!select || !messageContainer) return;

  messageContainer.innerHTML = '';

  updateCotisationMessage();
}

function updateCotisationMessage() {
  const cotisationMessage = document.getElementById('instruction-cotisation');
  const validationMessage = document.getElementById('instruction-validation');
  if (!cotisationMessage || !validationMessage) return;

  let sportSelected = false;
  for (let i = 1; i <= nbActiviteS; i++) {
    const checkbox = document.getElementById(`multi-activite-sportive-${i}`);
    if (checkbox && checkbox.checked) {
      sportSelected = true;
      break;
    }
  }
  // Vérification explicite du choix FFRP et de l'option valide
  const ffrpSelect = document.getElementById('multi-ffrp-option');
  const selectedOption = ffrpSelect ? ffrpSelect.value : '';

  const choixFfrpRadio = document.querySelector('input[name="choix-ffrp"]:checked');
  const veutFfrp = choixFfrpRadio && choixFfrpRadio.value === 'Oui';
  const isFfrpAdhesion = veutFfrp && selectedOption !== '';

  // Extraction automatique du montant de la licence (ex: "33€" ou "46€")
  let ffrpPriceText = "";
  if (selectedOption) {
    const priceMatch = selectedOption.match(/(\d+)\s*€/);
    if (priceMatch) {
      ffrpPriceText = `(${priceMatch[1]} €)`;
    }
  }

  // 1. Construction du texte de règlement avec des balises HTML <strong> (et non du Markdown **)
  let reglementHtml = "";
  if (isFfrpAdhesion) {
    reglementHtml = 'Règlement : Veuillez faire <strong>2 virements distincts</strong> (ou <strong>2 chèques séparés</strong>) :<br>' +
      '• 1er virement/chèque pour le <strong>Club</strong> (Cotisation 22 €) avec objet : <em>"Adhésion Club - Nom Prénom"</em><br>' +
      `• 2nd virement/chèque pour la <strong>FFRP</strong> ${ffrpPriceText} avec objet : <em>"Licence FFRP - Nom Prénom"</em>`;
  } else {
    reglementHtml = 'Règlement : Veuillez effectuer votre règlement (cotisation de 22 €) par <strong>virement bancaire</strong> ou par <strong>chèque</strong> avec objet : <em>"Adhésion Club - Nom Prénom"</em>';
  }

  // 2. Gestion des pièces justificatives (Certificat Médical) pour le Club ou la FFRP
  let prefixDocs = "";
  if (sportSelected) {
    const santeStatutFfrp = document.querySelector('input[name="multi-sante-statut"]:checked');
    const santeReponseClub = document.querySelector('input[name="multi-sante-reponse"]:checked');

    if ((santeStatutFfrp && santeStatutFfrp.value === "Nouveau ou Reprise") ||
        (santeReponseClub && santeReponseClub.value === "Besoin certificat médical")) {
      prefixDocs = "A fournir : le <strong>Certificat Médical (CACI)</strong>.<br>";
    }
  }

  // Injection garantie dans le paragraphe
  cotisationMessage.innerHTML = prefixDocs + reglementHtml;

  // 3. Message de bas de page (validation)
  if (isFfrpAdhesion) {
    validationMessage.innerHTML = '<span style="font-style: italic">La soumission en ligne ne valide pas les adhésions au club et à la FFRP. Vous devez effectuer vos 2 virements (ou remettre vos 2 chèques) au club pour valider votre inscription.</span>';
  } else {
    validationMessage.innerHTML = '<span style="font-style: italic">La soumission en ligne ne valide pas l\'adhésion. Vous devez effectuer votre virement ou remettre votre enveloppe au club pour valider votre inscription.</span>';
  }
}

function updateDateTimeAdhesion() {
  const now = new Date();
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };

  const dateStr = now.toLocaleDateString('fr-FR', dateOptions);
  const timeStr = now.toLocaleTimeString('fr-FR', timeOptions);

  const elDate = document.getElementById('date-adhesion');
  const elHeure = document.getElementById('heure-adhesion');
  if (elDate) elDate.textContent = dateStr;
  if (elHeure) elHeure.textContent = timeStr;
}

function showSection(sectionId) {
  document.getElementById('section-1-personnelles').style.display = 'none';
  document.getElementById('section-2-activites').style.display = 'none';
  document.getElementById('section-3-ffrp').style.display = 'none';
  document.getElementById('section-4-sante').style.display = 'none';
  document.getElementById('section-5-fede').style.display = 'none';
  document.getElementById('section-6-SES').style.display = 'none';

  if (sectionId === 'section-6-SES') {
    document.getElementById('submit-button-container').style.display = 'block';
    updateDateTimeAdhesion();
    updateCotisationMessage();
  } else {
    document.getElementById('submit-button-container').style.display = 'none';
  }

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (sectionValidators[sectionId]) {
    sectionValidators[sectionId]();
  }
}

function initSanteFfrpToggle() {
  const radios = document.querySelectorAll('input[name="multi-sante-statut"]');
  const blocRenouv = document.getElementById('bloc-sante-renouvellement');
  const blocCaci = document.getElementById('bloc-sante-caci');

  if (!radios.length) return;

  radios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === "Renouvellement") {
        if (blocRenouv) blocRenouv.style.display = 'block';
        if (blocCaci) blocCaci.style.display = 'none';
      } else if (this.value === "Nouveau ou Reprise") {
        if (blocRenouv) blocRenouv.style.display = 'none';
        if (blocCaci) blocCaci.style.display = 'block';
      }
      
      // Met à jour l'état de validation du bouton "Suivant" de la section
      if (sectionValidators['section-4-sante']) {
        sectionValidators['section-4-sante']();
      }
    });
  });
}

function initFormNavigation() {
  setupSectionValidation('section-1-personnelles', 'next-button-section-1');
  setupSectionValidation('section-2-activites', 'next-button-activities');
  setupSectionValidation('section-3-ffrp', 'next-button-ffrp');
  setupSectionValidation('section-4-sante', 'next-button-sante');
  setupSectionValidation('section-5-fede', 'next-button-fede');        
  
  initSanteFfrpToggle();
  
  showSection('section-1-personnelles');
  renderFfrpDropdown();
  // 1. Infos Perso -> Activités

  const nextButtonSection1 = document.getElementById('next-button-section-1');
  if (nextButtonSection1) {
    nextButtonSection1.addEventListener('click', function() {
      showSection('section-2-activites');
    });
  }
 // 2. Activités -> FFRP (si rando), Santé (si autre sport), ou Signature/Loisirs (si loisirs uniquement)
  const nextButtonActivities = document.getElementById('next-button-activities');
  if (nextButtonActivities) {
    nextButtonActivities.addEventListener('click', function() {
    	const mevoRandoCheckbox = document.getElementById('multi-activite-sportive-1'); 
      	const randoSelected = mevoRandoCheckbox && mevoRandoCheckbox.checked;

      let autreSportSelected = false;
      for (let i = 1; i <= nbActiviteS; i++) {
        const checkbox = document.getElementById(`multi-activite-sportive-${i}`);
        if (checkbox && checkbox !== mevoRandoCheckbox && checkbox.checked) {
          autreSportSelected = true;
          break;
        }
      }                        

      if (randoSelected) {
        showSection('section-3-ffrp'); // Vers FFRP
      } else if (autreSportSelected) {
        showSection('section-4-sante'); // Vers Santé (si autre sport sans rando)
      } else {
        showSection('section-6-SES'); // Vers Signature (si loisirs uniquement)
      }
    });
  }
// 3. FFRP -> Options/Assurance (si OUI) ou Santé (si NON)
  const nextButtonFFRP = document.getElementById('next-button-ffrp');
  if (nextButtonFFRP) {
    nextButtonFFRP.addEventListener('click', function() {
      const choixFFRP = document.querySelector('input[name="choix-ffrp"]:checked');
      const veutFfrp = choixFFRP && choixFFRP.value === 'Oui';

      if (veutFfrp) {
        showSection('section-5-fede'); // Vers Options FFRP
      } else {
        showSection('section-4-sante'); // Directement vers Santé
      }
    });
  }

  // 5. Options/Assurance -> Santé
  const nextButtonSection5 = document.getElementById('next-button-fede');
  if (nextButtonSection5) {
    nextButtonSection5.addEventListener('click', function() {
      showSection('section-4-sante'); // Passage par la santé après l'assurance
    });
  }

  // 4. Santé -> Signature finale
  const nextButtonSante = document.getElementById('next-button-sante');
  if (nextButtonSante) {
    nextButtonSante.addEventListener('click', function() {
      showSection('section-6-SES'); // Fin du parcours vers la signature
    });
  }
}
  

// ===========================================================================
// 4. INITIALISATION PRINCIPALE DU FORMULAIRE
// ===========================================================================
function initFormulaire() {
  const form = document.getElementById('adhesion-form');
  const submitButton = document.getElementById('submit-button');
  const statusMessage = document.getElementById('status-message');

  if (memberData && memberData.found) {
    const nomField = document.getElementById('multi-nom');
    const prenomField = document.getElementById('multi-prenom');
    const dateNField = document.getElementById('multi-date-n');

    if (nomField) { nomField.value = memberData.nom; nomField.readOnly = true; nomField.style.backgroundColor = '#e9ecef'; nomField.style.cursor = 'not-allowed'; }
    if (prenomField) { prenomField.value = memberData.prenom; prenomField.readOnly = true; prenomField.style.backgroundColor = '#e9ecef'; prenomField.style.cursor = 'not-allowed'; }
    if (dateNField) { dateNField.value = memberData.dateNaissance; dateNField.readOnly = true; dateNField.style.backgroundColor = '#e9ecef'; dateNField.style.cursor = 'not-allowed'; }

    document.getElementById('multi-adresse').value = memberData.adresse || '';
    document.getElementById('multi-ville').value = memberData.ville || '';
    document.getElementById('multi-code').value = memberData.codePostal || '';
    document.getElementById('multi-email').value = memberData.email || '';
    document.getElementById('multi-phone').value = memberData.telephone || '';
    
    // Pré-remplissage des champs de la personne à prévenir en cas d'urgence
    const urgenceNomField = document.getElementById('multi-urgence-nom'); // Vérifie l'ID exact de ton input nom d'urgence dans index.html
    const urgencePrenomField = document.getElementById('multi-urgence-prenom'); // Vérifie l'ID exact de ton input prénom d'urgence
    const urgencePhoneField = document.getElementById('multi-urgence-phone'); // Vérifie l'ID exact de ton input téléphone d'urgence
    if (urgenceNomField) urgenceNomField.value = memberData.urgenceNom || '';
    if (urgencePrenomField) urgencePrenomField.value = memberData.urgencePrenom || '';
    if (urgencePhoneField) urgencePhoneField.value = memberData.urgencePhone || '';
    // Pré-remplissage de la case "Droit à l'image"
    const droitImageCheckbox = document.getElementById('multi-droit-image');
    if (droitImageCheckbox) {
      droitImageCheckbox.checked = (memberData.droitImage === 'Oui');
      }
    // Succès
    afficherMessageInfo('Vos données de l\'année dernière sont pré-remplies. Vous pouvez modifier votre adresse, ville, code postal, email et téléphone si nécessaire.', 'info', 'section-1-personnelles');
  
  } else if(token) {
    afficherMessageInfo('Aucune donnée trouvée pour l\'année dernière.', 'warning', 'section-1-personnelles');
    }

  renderActivityCheckboxes();
  initFormNavigation();

function onSuccess(response) {
    if (response.success) {
      const mainContainer = document.getElementById('main-container');
      mainContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; text-align: center; padding: 40px;">
          <div style="font-size: 4em; color: #28a745; margin-bottom: 20px;">✓</div>
          <h2 style="color: #28a745; font-size: 1.8em; margin-bottom: 15px;">Adhésion enregistrée avec succès !</h2>
          <p id="success-msg" style="font-size: 1.1em; color: #666; margin-bottom: 5px;"></p>
          <p id="success-time" style="font-size: 1.1em; color: #666; margin-bottom: 10px;"></p>
          <p style="font-size: 0.95em; color: #888; font-style: italic;">Pour valider votre inscription, n'oubliez pas d'effectuer votre virement ou de remettre votre enveloppe au club.</p>
        </div>
      `;
      // 🛡️ Utilisation sécurisée de textContent
      document.getElementById('success-msg').textContent = response.message || "Votre demande d'adhésion a bien été enregistrée.";
      document.getElementById('success-time').textContent = response.dateTime || "";
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onError({ message: response.message });
    }
  }

  function onError(error) {
    if (submitButton) submitButton.disabled = false;
    if (statusMessage) {
      statusMessage.style.display = "block";
      statusMessage.style.backgroundColor = "#f8d7da";
      statusMessage.style.color = "#721c24";
      const errorMsg = (error && error.message) || (typeof error === "string" && error) || "Une erreur inconnue est survenue.";
      statusMessage.textContent = "Erreur lors de l'enregistrement : " + errorMsg;
    }
    console.error("❌ ERROR :", error);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitButton) submitButton.disabled = true;
      if (statusMessage) statusMessage.style.display = 'none';

      const data = {};
      new FormData(form).forEach((value, key) => (data[key] = value));
      
      // 🛡️ Ajout du token s'il est présent pour sécuriser l'écriture
      if (token) {
        data.token = token;
      }

      fetch(GAS_EXEC_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
        redirect: "follow",
      })
        .then((response) => response.json())
        .then(onSuccess)
        .catch(onError);
    });
  }
}

// ===========================================================================
// 5. POINT D'ENTRÉE DU SCRIPT
// ===========================================================================
document.addEventListener("DOMContentLoaded", chargerDonneesEtInitialiser);
