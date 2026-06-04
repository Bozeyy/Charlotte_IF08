let ingredients = [];

/**
 * Fonction d'initialisation principale
 */
async function loadDataAndFetch() {
  try {
    const cachedIngredients = localStorage.getItem("charlotteIngredients");

    if (cachedIngredients) {
      console.log("⚡ Chargement depuis le cache...");
      ingredients = JSON.parse(cachedIngredients);
    } else {
      console.log("⏳ Appel API Open Food Facts...");
      const responseData = await fetch("./data/data.json");
      
      if (!responseData.ok) throw new Error("Erreur JSON (Vérifie que tu utilises Live Server)");
      const DATA_JSON = await responseData.json();

      await fetch_open_food_facts(DATA_JSON);
      
      try {
        // Sauvegarde dans le cache sous un nouveau nom
        localStorage.setItem("charlotteIngredients", JSON.stringify(ingredients));
      } catch (e) {
        console.warn("Le cache localStorage n'est pas disponible.", e);
      }
    }

    // On attend que les ingrédients soient prêts dans le DOM
    await addIngredient();

    // On cache le loader
    hideLoader();

  } catch (error) {
    console.error("Erreur globale :", error);
    hideLoader(); 
  }
}

/**
 * Masque l'écran de chargement avec une transition
 */
function hideLoader() {
  const loader = document.getElementById('loader');
  const mainContent = document.getElementById('main-content');
  
  if(loader && mainContent) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.classList.add('d-none');
      mainContent.classList.remove('d-none');
    }, 500);
  }
}

/**
 * Appel API Open Food Facts en parallèle (Promise.all)
 */
async function fetch_open_food_facts(DATA_JSON) {
  const validNutriscores = ["a", "b", "c", "d", "e"];

  const fetchPromises = DATA_JSON.map(async (product) => {
    const code = product.barcode;
    try {
      const url = `https://world.openfoodfacts.org/api/v0/product/${code}.json`;
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const data = await response.json();

      if (data.status === 1) {
        let { product_name, image_front_small_url, nutriscore_grade } = data.product;

        if (!validNutriscores.includes(nutriscore_grade?.toLowerCase())) {
          nutriscore_grade = "inconnu";
        }

        return {
          product_name: product_name || product.product_name,
          image_front_small_url: image_front_small_url || "https://via.placeholder.com/150?text=Indisponible",
          nutriscore_grade: nutriscore_grade.toUpperCase(),
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  });

  const results = await Promise.all(fetchPromises);
  ingredients = results.filter(item => item !== null);
}

/**
 * Création des cartes dynamiques et injection dans le HTML
 */
async function addIngredient() {
  const container = document.getElementById("ingredients");
  container.innerHTML = ""; 

  for (const ingredient of ingredients) {
    const score = ingredient.nutriscore_grade;
    
    let badgeClass = "bg-secondary";
    if (score === "A" || score === "B") badgeClass = "bg-success";
    else if (score === "C") badgeClass = "bg-warning text-dark";
    else if (score === "D" || score === "E") badgeClass = "bg-danger";

    const cardHTML = `
      <div class="col-6 col-sm-4 col-md-3 col-lg-2">
        <div class="card h-100 ingredient-card shadow-sm border-0">
          <div class="img-container">
            <img src="${ingredient.image_front_small_url}" class="ingredient-img" alt="${ingredient.product_name}">
          </div>
          <div class="card-body p-3 text-center d-flex flex-column justify-content-between bg-white rounded-bottom-3">
            <h6 class="card-title text-truncate mb-3" title="${ingredient.product_name}">
              ${ingredient.product_name}
            </h6>
            <div class="mt-auto">
              <span class="small text-muted me-1">Nutri-Score</span>
              <span class="badge rounded-pill ${badgeClass} px-2 py-1 shadow-sm">${score}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += cardHTML;
  }
}

// Lancement
loadDataAndFetch();