
  // URL de la Web App Apps Script (à remplacer par votre URL réelle de déploiement /exec)
	const GAS_EXEC_URL = "https://script.google.com/macros/s/AKfycbwlr40GiiJGpckSFgb3ZdbD-D8_i8xw5L40d4l-ziyX9WMfJ1YDHvk1MUREgmoLvYb0/exec";
    // Variables auparavant injectées par Apps Script (<?= ... ?>), maintenant chargées via fetch
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
   	 if (token) {
      try { 
         const res = await fetch(`${GAS_EXEC_URL}?token=${encodeURIComponent(token)}`);
         const json = await res.json();
         memberData = json.memberData;
         nbActiviteS = json.config.nbActiviteS;
         nbActiviteL = json.config.nbActiviteL;
         nomActivitesSportives = json.config.nomActivitesSportives;
         nomActivitesLoisirs = json.config.nomActivitesLoisirs;
         nbOptions = json.config.nbOptions;
         optionsFFRP = json.config.optionsFFRP;
       } 
      catch (err) {
          console.error("Erreur de chargement des données :", err);
        }
    } 
   initFormulaire();

// ===========================================================================
// 3. INITIALISATION DU FORMULAIRE ET DES ÉVÉNEMENTS
// ===========================================================================
	// Initialisation du formulaire
	// document.addEventListener('DOMContentLoaded', function () {
	function initFormulaire() {
		const form = document.getElementById('adhesion-form');
		const submitButton = document.getElementById('submit-button');
		const statusMessage = document.getElementById('status-message');
		// Pré-remplissage si données membre trouvées
		const prenomInput = document.getElementById('multi-prenom');
		const nomInput = document.getElementById('multi-nom');
		const dateNInput = document.getElementById('multi-date-n');

		// Pré-remplissage si données membre trouvées
		if (memberData && memberData.found) {
			// console.log("Données membre trouvées:", memberData);

			const nomField = document.getElementById('multi-nom');
			const prenomField = document.getElementById('multi-prenom');
			const dateNField = document.getElementById('multi-date-n');

			nomField.value = memberData.nom;
			prenomField.value = memberData.prenom;
			dateNField.value = memberData.dateNaissance;

			nomField.readOnly = true;
			prenomField.readOnly = true;
			dateNField.readOnly = true;

			nomField.style.backgroundColor = '#e9ecef';
			prenomField.style.backgroundColor = '#e9ecef';
			dateNField.style.backgroundColor = '#e9ecef';
			nomField.style.cursor = 'not-allowed';
			prenomField.style.cursor = 'not-allowed';
			dateNField.style.cursor = 'not-allowed';

			document.getElementById('multi-adresse').value = memberData.adresse || '';
			document.getElementById('multi-ville').value = memberData.ville || '';
			document.getElementById('multi-code').value = memberData.codePostal || '';
			document.getElementById('multi-email').value = memberData.email || '';
			document.getElementById('multi-phone').value = memberData.telephone || '';

			const infoMessage = document.createElement('div');
			infoMessage.style.cssText = 'background-color: #cfe2ff; color: #084298; padding: 12px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #0d6efd;';
			infoMessage.innerHTML = 'Vos données de l\'année dernière sont pré-remplies. Vous pouvez modifier votre adresse, ville, code postal, email et téléphone si nécessaire.';

			const section1 = document.getElementById('section-1-personnelles');
			if (section1) {
				section1.insertBefore(infoMessage, section1.firstChild);
			} else {
				form.insertBefore(infoMessage, form.firstChild);
			}
		}
		// Rendu des activités au chargement
		renderActivityCheckboxes();
		// Initialisation de la navigation et des validations
	  	initFormNavigation();

	  // Écouteur pour la soumission
	  form.addEventListener('submit', function (e) {
		e.preventDefault();
		submitButton.disabled = true;
		statusMessage.style.display = 'none';

		const data = {};
		new FormData(form).forEach((value, key) => (data[key] = value));

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
/**
 * Détermine si un élément est actuellement visible à l'écran
 * (retourne false si l'élément ou l'un de ses parents a display: none)
 */
function isElementVisible (el) {
  return !!(el && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0));
}

		// ================== VALIDATION GÉNÉRIQUE DES SECTIONS ==================
		/**
		 * Vérifie si tous les champs obligatoires d'un conteneur/section sont valides.
		 * @param {HTMLElement|string} sectionElement - L'élément de la section ou son ID.
		 * @returns {boolean}
		 */
function isSectionValid(section) {
  if (!section) return true;

  // 1. Vérification des inputs texte / email / tel / select obligatoires (visibles uniquement)
  const requiredInputs = section.querySelectorAll(
    'input[required]:not([type="checkbox"]):not([type="radio"]), ' +
    'input[data-required="true"]:not([type="checkbox"]):not([type="radio"]), ' +
    'select[required], ' +
    'select[data-required="true"], ' +
    'textarea[required], ' +
    'textarea[data-required="true"]'
  );
 
  for (const input of requiredInputs) {
    const visible = isElementVisible(input);
    const filled = !!input.value.trim();
    if (visible && !filled) {
      return false;
    }
  }
 

  // 2. Vérification des groupes de boutons radio
  const radioGroups = new Set();
  section.querySelectorAll('input[type="radio"][data-required="true"], input[type="radio"][required]').forEach(radio => {
    if (isElementVisible(radio)) {
      radioGroups.add(radio.name);
    }
  });

  for (const groupName of radioGroups) {
    const checked = section.querySelector(`input[type="radio"][name="${groupName}"]:checked`);
    if (!checked) {
      return false;
    }
  }

  // 3. Vérification des checkboxes individuelles obligatoires (data-required="true")
  const requiredCheckboxes = section.querySelectorAll('input[type="checkbox"][data-required="true"], input[type="checkbox"][required]');
  for (const cb of requiredCheckboxes) {
    const visible = isElementVisible(cb);
    if (visible && !cb.checked) {
      return false;
    }
  }

  // 4. Groupe de checkboxes (au moins une cochée)
  const checkboxGroups = section.querySelectorAll('[data-required-checkboxes]');
  for (const group of checkboxGroups) {
    const visible = isElementVisible(group);
    if (visible) {
      const checkedCount = group.querySelectorAll('input[type="checkbox"]:checked').length;
      if (checkedCount === 0) {
        return false;
      }
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
/**
 * Attache la validation automatique entre une section et son bouton 'Suivant'
 * @param {string} sectionId - L'ID de la section HTML
 * @param {string} buttonId - L'ID du bouton 'Suivant'
 */
	function setupSectionValidation(sectionId, buttonId) {
		const section = document.getElementById(sectionId);
		const button = document.getElementById(buttonId);
		if (!section || !button) return;
		const updateState = () => {
			// ✅ Garde-fou : une section masquée n'est jamais "valide"
			if (getComputedStyle(section).display === 'none') {
				setButtonState(button, false);
				return;
				}
			const valid = isSectionValid(section);
			setButtonState(button, valid);
		};
		sectionValidators[sectionId] = updateState; // ✅ NOUVEAU
			section.addEventListener('input', updateState);
			section.addEventListener('change', updateState);
			updateState();
		}
			function onSuccess(response) {
			if (response.success) {
				// Remplacer tout le contenu du main-container (ne pas masquer le form car main-container est dedans)
				const mainContainer = document.getElementById('main-container');
				mainContainer.innerHTML = `
					<div style="
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						min-height: 400px;
						text-align: center;
						padding: 40px;
					">
						<div style="
							font-size: 4em;
							color: #28a745;
							margin-bottom: 20px;
						">✓</div>
						<h2 style="
							color: #28a745;
							font-size: 1.8em;
							margin-bottom: 15px;
						">Adhésion enregistrée avec succès !</h2>
						<p style="
							font-size: 1.1em;
							color: #666;
							margin-bottom: 5px;
						">${response.message || "Votre demande d'adhésion a été enregistrée."}</p>
						<p style="
							font-size: 1.1em;
							color: #666;
							margin-bottom: 10px;
						">${response.dateTime || ""}</p>
						<p style="
							font-size: 0.95em;
							color: #888;
							font-style: italic;
						">Pour valider votre inscription, n'oubliez pas d'effectuer votre virement ou de remettre votre enveloppe au club.</p>
					</div>
				`;

				// Scroller vers le haut
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} else {
				onError({ message: response.message });
				return;
			}
		}

		function onError(error) {
			submitButton.disabled = false;
			statusMessage.style.display = "block";
			statusMessage.style.backgroundColor = "#f8d7da";
			statusMessage.style.color = "#721c24";

			// Log complet pour débogage
			console.error("❌ ERROR - google.script.run.processForm failed:");
			console.error("Error object:", error);
			console.error("Error stringified:", JSON.stringify(error, null, 2));
			if (error && error.message) {
				console.error("Error message:", error.message);
			}

			// Afficher message à l'utilisateur
			const errorMsg =
				(error && error.message) ||
				(error && typeof error === "string" && error) ||
				"Une erreur inconnue est survenue.";
			statusMessage.textContent = "Erreur lors de l'enregistrement : " + errorMsg;
		}

		// ✅ Mise à jour dynamique du message de cotisation et validation
		function updateCotisationMessage() {
			const cotisationMessage = document.getElementById('instruction-cotisation');
			const validationMessage = document.getElementById('instruction-validation');
			let sportSelected = false;

			// Vérifier toutes les activités sportives dynamiques
			for (let i = 1; i <= nbActiviteS; i++) {
				const checkbox = document.getElementById(`multi-activite-sportive-${i}`);
				if (checkbox && checkbox.checked) {
					sportSelected = true;
					break;
				}
			}

			// Vérifier si une adhésion FFRP est demandée
			const ffrpSelect = document.getElementById('multi-ffrp-option');
			const selectedOption = ffrpSelect ? ffrpSelect.value : '';
			const optionIndex = selectedOption ? optionsFFRP.indexOf(selectedOption) : -1;
			const isFfrpAdhesion = optionIndex >= 0 && optionIndex < (nbOptions - 1);

  if (sportSelected) {
    // Vérifier le statut de santé sélectionné
    const santeStatut = document.querySelector('input[name="multi-sante-statut"]:checked');
    if (santeStatut) {
      let docs = [];
      if (santeStatut.value === "Nouveau ou Reprise") {
        docs.push("le <strong>Certificat Médical (CACI)</strong>");
      }

      let reglement = isFfrpAdhesion 
        ? "cotisation de 28 € + licence FFRP" 
        : "cotisation de 28 €";

      if (docs.length > 0) {
        cotisationMessage.innerHTML = "A fournir : " + docs.join(", ") + ". Règlement (" + reglement + ") par <strong>virement bancaire</strong> ou par <strong>chèque(s)</strong> sous enveloppe.";
      } else {
        cotisationMessage.innerHTML = "Règlement (" + reglement + ") par <strong>virement bancaire</strong> ou par <strong>chèque(s)</strong> sous enveloppe.";
      }
    }
  } else {
    // Pas d'activité sportive
    let reglement = isFfrpAdhesion 
      ? "cotisation de 28 € + licence FFRP" 
      : "cotisation de 28 €";

    cotisationMessage.innerHTML = "Règlement (" + reglement + ") par <strong>virement bancaire</strong> ou par <strong>chèque(s)</strong> sous enveloppe.";
  }
			// Modifier message de validation selon FFRP
			if (isFfrpAdhesion) {
				validationMessage.innerHTML =
					'<span style="font-style: italic">La soumission en ligne ne valide pas les adhésions au club et à la FFRP. Vous devez effectuer votre virement ou remettre votre enveloppe au club pour valider ces inscriptions.</span>';
			} else {
				validationMessage.innerHTML =
					'<span style="font-style: italic">La soumission en ligne ne valide pas l\'adhésion. Vous devez effectuer votre virement ou remettre votre enveloppe au club pour valider ces inscriptions.</span>';
			}
		}
//
/**
 * Active ou désactive un bouton en fonction d'un état booléen
 * @param {string|HTMLElement} button - L'élément bouton ou son ID
 * @param {boolean} isValid - true pour activer, false pour désactiver
 */
function renderActivityCheckboxes() {
  // Activités Sportives
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
      
      // Écouteur pour mettre à jour l'état du bouton
    });
  }

  // Activités Loisirs
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

      // Écouteur pour mettre à jour l'état du bouton
    });
  }
}

		// ================== LOGIQUE FFRP ET NAVIGATION ==================

// Rendu du menu déroulant FFRP
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
  const nextBtn = document.getElementById('next-button-fede');

if (select) {
    select.addEventListener('change', function() {
      updateFfrpMessage();
    });
  }
}

		// Mise à jour du message d'instruction FFRP
		function updateFfrpMessage() {
			const messageContainer = document.getElementById('ffrp-instruction-message');
			const select = document.getElementById('multi-ffrp-option');
			if (!select || !messageContainer) return;

			const selectedOption = select.value;
			const optionIndex = optionsFFRP.indexOf(selectedOption);
			messageContainer.innerHTML = '';

			// Les (nbOptions - 1) premières options sont des adhésions FFRP
			// Les options suivantes nécessitent une attestation d'assurance personnelle
			if (optionIndex >= 0 && optionIndex < (nbOptions - 1)) {
				// Adhésions FFRP
				messageContainer.innerHTML = 'Règlement par <strong>virement bancaire</strong> ou par <strong>chèque(s)</strong> (Adhésion + FFRP) à remettre sous enveloppe.';
			} else if (optionIndex >= (nbOptions - 1)) {
				// Assurance personnelle
				messageContainer.innerHTML = 'Fournir une <strong>attestation d\'assurance</strong>. Règlement par <strong>virement bancaire</strong> ou par <strong>chèque</strong> sous enveloppe.';
			}

			// ✅ Appeler updateCotisationMessage pour mettre à jour le message de section 6
			updateCotisationMessage();
		}

		// Fonction de gestion de la navigation
		function showSection(sectionId) {
			// Masquer toutes les sections
			document.getElementById('section-1-personnelles').style.display = 'none';
			document.getElementById('section-2-activites').style.display = 'none';
			document.getElementById('section-3-ffrp').style.display = 'none';
			document.getElementById('section-4-sante-ffrp').style.display = 'none';
			document.getElementById('section-4-sante-club').style.display = 'none';
			document.getElementById('section-5-fede').style.display = 'none';
			document.getElementById('section-6-SES').style.display = 'none';

			// Gérer l'affichage du bouton final et date/heure
			if (sectionId === 'section-6-SES') {
				document.getElementById('submit-button-container').style.display = 'block';
				// Mettre à jour la date et l'heure actuelles
				updateDateTimeAdhesion();
				// Mettre à jour le message de cotisation selon la réponse santé
				updateCotisationMessage();
			} else {
				document.getElementById('submit-button-container').style.display = 'none';
			}

			// Afficher la section demandée
			const targetSection = document.getElementById(sectionId);
			if (targetSection) {
				targetSection.style.display = 'block';
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
  // ✅ NOUVEAU : revalider maintenant que la section est réellement visible
    if (sectionValidators[sectionId]) {
        sectionValidators[sectionId]();
    }

		}

		// Fonction pour mettre à jour la date et l'heure d'adhésion
		function updateDateTimeAdhesion() {
			const now = new Date();
			const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
			const timeOptions = { hour: '2-digit', minute: '2-digit' };

			const dateStr = now.toLocaleDateString('fr-FR', dateOptions);
			const timeStr = now.toLocaleTimeString('fr-FR', timeOptions);

			document.getElementById('date-adhesion').textContent = dateStr;
			document.getElementById('heure-adhesion').textContent = timeStr;
		}

		// Initialisation de la navigation
		function initFormNavigation() {
		// === NOUVELLES LIGNES À AJOUTER ICI ===
			setupSectionValidation('section-1-personnelles', 'next-button-section-1');
			setupSectionValidation('section-2-activites', 'next-button-activities');
			setupSectionValidation('section-3-ffrp', 'next-button-ffrp');
			setupSectionValidation('section-4-sante-ffrp', 'next-button-sante-ffrp');
			setupSectionValidation('section-4-sante-club', 'next-button-sante-club');
			setupSectionValidation('section-5-fede', 'next-button-fede');				
			// Afficher uniquement la première section au chargement
			showSection('section-1-personnelles');

			// Rendu du dropdown FFRP (appelé une seule fois)
			renderFfrpDropdown();

			// 1. Gérer le bouton 'Suivant' APRES LA SECTION 1
			const nextButtonSection1 = document.getElementById('next-button-section-1');
			if (nextButtonSection1) {
				nextButtonSection1.addEventListener('click', function() {
					// const nomValide = nomInput.value && prenomInput.value && dateNInput.value;
					showSection('section-2-activites'); // Affiche Sections 2 & 3 ensemble
				});
			}

			// 2. Gérer le bouton 'Suivant' APRÈS LES ACTIVITÉS (Section 2)
			const nextButtonActivities = document.getElementById('next-button-activities');
			if (nextButtonActivities) {
				nextButtonActivities.addEventListener('click', function() {
					
					// 1. Vérifier si la Randonnée spécifiquement est cochée
					// (Adapter l'ID 'multi-activite-sportive-1' selon l'emplacement exact de la Randonnée)
					const mevoRandoCheckbox = document.getElementById('multi-activite-sportive-1'); 
					const randoSelected = mevoRandoCheckbox && mevoRandoCheckbox.checked;

					// 2. Vérifier si au moins une AUTRE activité sportive est cochée
					let autreSportSelected = false;
					for (let i = 1; i <= nbActiviteS; i++) {
						const checkbox = document.getElementById(`multi-activite-sportive-${i}`);
						// Si ce n'est pas la case Randonnée et qu'elle est cochée
						if (checkbox && checkbox !== mevoRandoCheckbox && checkbox.checked) {
							autreSportSelected = true;
							break;
						}
					}                        
					// 3. Aiguillage selon la sélection
					if (randoSelected) {
						// Randonnée sélectionnée -> Choix FFRP obligatoire
						showSection('section-3-ffrp');
					} else if (autreSportSelected) {
						// Pas de Randonnée, mais un autre sport -> Santé Club directement
						showSection('section-4-sante-club');
					} else {
						// Aucun sport sélectionné -> Saut vers la section SES
						showSection('section-6-SES');
					}
				});
			}
			// 3. Gérer le bouton 'Suivant' DE LA SECTION 3 (Choix FFRP)
			const nextButtonFFRP = document.getElementById('next-button-ffrp');
			if (nextButtonFFRP) {
				nextButtonFFRP.addEventListener('click', function() {
					const choixFFRP = document.querySelector('input[name="choix-ffrp"]:checked');
					if (choixFFRP && choixFFRP.value === 'Oui') {
						showSection('section-4-sante-ffrp');
					} else {
						showSection('section-4-sante-club');
					}
				});
			}
			// 4. Gérer le bouton 'Suivant' APRÈS LA SECTION SANTÉ FFRP (Section 4a)
			const nextButtonSanteFFRP = document.getElementById('next-button-sante-ffrp') ;
			if (nextButtonSanteFFRP) {
				nextButtonSanteFFRP.addEventListener('click', function() {
						showSection('section-5-fede');
				});
			}	
			// 4. Gérer le bouton 'Suivant' APRÈS LA SECTION SANTÉ CLUB (Section 4b)
			const nextButtonSanteClub = document.getElementById('next-button-sante-club');
			if (nextButtonSanteClub) {
				nextButtonSanteClub.addEventListener('click', function() {
					showSection('section-6-SES');
				});
			}
		
			// 4. Gérer le bouton 'Suivant' après la FFRP (Section 5)
			const nextButtonSection5 = document.getElementById('next-button-fede');
			if (nextButtonSection5) {
				nextButtonSection5.addEventListener('click', function() {
					// La vérification n'est plus nécessaire car le bouton est inactif si vide
					showSection('section-6-SES');
				});
			}
		}
	};
// ===========================================================================
// 5. POINT D'ENTRÉE (À la toute fin du fichier)
// ===========================================================================
	document.addEventListener("DOMContentLoaded", chargerDonneesEtInitialiser);

