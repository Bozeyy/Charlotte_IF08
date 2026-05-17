let ingredients = [];

async function loadDataAndFetch() {
  try {
    const responseData = await fetch("./data/data.json");
    const DATA_JSON = await responseData.json();

    await fetch_open_food_facts(DATA_JSON);

    await addIngredient();
  } catch (error) {
    console.error("Erreur lors de l'initialisation :", error);
  }
}

async function fetch_open_food_facts(DATA_JSON) {
  for (const product of DATA_JSON) {
    const code = product.barcode;

    try {
      const url =
        "https://world.openfoodfacts.org/api/v0/product/" + code + ".json";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Erreur HTTP", response.status);
      }

      const data = await response.json();

      if (data.status === 1) {
        let { product_name, image_front_small_url, nutriscore_grade } =
          data.product;

        console.log("Code : ", code);
        console.log("Nom produit :", product_name);
        console.log("Image URL :", image_front_small_url);
        console.log(
          "Nutri-score : " +
            (nutriscore_grade ? nutriscore_grade.toUpperCase() : "Inconnu") +
            "\n",
        );

        if (
          nutriscore_grade !== "a" &&
          nutriscore_grade !== "b" &&
          nutriscore_grade !== "c" &&
          nutriscore_grade !== "d" &&
          nutriscore_grade !== "e"
        ) {
          nutriscore_grade = "Inconnu";
        }

        ingredients.push({
          product_name,
          image_front_small_url,
          nutriscore_grade,
        });
      } else {
        console.log("Produit non trouvé pour le code " + code + "\n");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données pour " + code + ":",
        error,
      );
    }
  }
}

async function addIngredient() {
  const container = document.getElementById("ingredients");

  for (const ingredient of ingredients) {
    const nutriscore = ingredient.nutriscore_grade
      ? ingredient.nutriscore_grade.toUpperCase()
      : "Inconnu";

    const cardHTML = `
      <div class="col-12 col-md-4 mb-4">
        <div class="card h-100">
          <img src="${ingredient.image_front_small_url}" class="card-img-top" alt="${ingredient.product_name}">
          <div class="card-body text-center">
            <h5 class="card-title">${ingredient.product_name}</h5>
            <p class="card-text fw-bold">Nutri-score : <span class="badge bg-secondary">${nutriscore}</span></p>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += cardHTML;
  }
}

loadDataAndFetch();
