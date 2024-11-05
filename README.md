# MasheDataTable

Une solution complète de tableau de données pour Ruby on Rails avec fonctionnalités de tri, filtrage, recherche et pagination.

## Installation

1. Clonez ce repository dans un dossier temporaire.

2. Définissez le chemin vers mashe-datatable et exécutez les commandes suivantes :
```bash
# Définissez le chemin vers votre dossier mashe-datatable
MASHE_DATATABLE_PATH="/chemin/complet/vers/mashe-datatable"
```
Par exemple, si vous avez cloné le repository dans `/Users/vous/code/mashe-datatable`, vous devrez écrire :
```bash
MASHE_DATATABLE_PATH="/Users/vous/code/mashe-datatable"
```

3. Puis placez vous dans la racine de votre application Rails et exécutez les commandes suivantes :
```bash
# Création des dossiers nécessaires
echo "Création des dossiers..."
mkdir -p app/services/data_tables
mkdir -p app/helpers
mkdir -p app/views/shared/data_table
mkdir -p app/assets/stylesheets/components/data_table

# Génération du controller Stimulus
echo "Génération du controller Stimulus..."
rails g stimulus datatable

# Copie des fichiers
echo "Copie des fichiers..."
cp "$MASHE_DATATABLE_PATH/app/services/data_tables/"* app/services/data_tables/
cp "$MASHE_DATATABLE_PATH/app/helpers/"* app/helpers/
cp "$MASHE_DATATABLE_PATH/app/views/shared/data_table/"* app/views/shared/data_table/
cp "$MASHE_DATATABLE_PATH/app/javascript/controllers/datatable_controller.js" app/javascript/controllers/
cp "$MASHE_DATATABLE_PATH/app/assets/stylesheets/components/data_table/"* app/assets/stylesheets/components/data_table/

# Import des styles
echo "Configuration des styles..."
echo -e "\n@import \"components/data_table/index\";" >> app/assets/stylesheets/application.scss

echo "Installation terminée !"
```

## Utilisation

### Création d'un nouveau tableau de données

#### Dans un controller

```ruby
def index
  @dataset = DataTables::MasheDataTable.new()
  @dataset.title = "Mon Tableau"
  @dataset.rows = Model.all
  @dataset.searchable = true
  @dataset.pagination = { initial_per_page: 10, per_page_options: [10, 25, 50] }
  @dataset.columns = [
    { header: "Colonne 1", method: :column1, sortable: true, classes: ["col-lg-4"] },
    { header: "Colonne 2", method: :column2, sortable: true, classes: ["col-lg-4"] }
  ]
  @dataset.build_hash
end
```

Et dans votre vue :
``` erb
<%= render partial: "shared/data_table/data_table_wrapper", locals: { dataset: @dataset } %>
```
#### Dans une partial (utilisation conseillée)
``` erb
<%
  @dataset = DataTables::MasheDataTable.new()
  @dataset.title = "Mon Tableau"
  @dataset.rows = Model.all
  @dataset.searchable = true
  @dataset.pagination = { initial_per_page: 10, per_page_options: [10, 25, 50] }
  @dataset.columns = [
    { header: "Colonne 1", method: :column1, sortable: true, classes: ["col-lg-4"] },
    { header: "Colonne 2", method: :column2, sortable: true, classes: ["col-lg-4"] }
  ]
  @dataset.build_hash
%>
<%= render partial: "shared/data_table/data_table_wrapper", locals: { dataset: @dataset } %>
```


### Options disponibles

#### Colonnes
- `header`: Titre de la colonne
- `method`: Méthode à appeler sur l'objet
- `sortable`: Permet le tri (true/false)
- `classes`: Classes CSS à appliquer
- `formatter`: Formateur spécial (:date, :currency, etc.)
- `type`: Type spécial (:link, :indicator, etc.)

```ruby
dataset.columns = [
{
header: "Titre colonne",
method: :methode_a_appeler,
sortable: true,
classes: ["col-lg-4"]
}
]
```

###### Options de base
- header: Titre de la colonne (String)
- method: Méthode à appeler sur l'objet (Symbol)
- sortable: Permet le tri (Boolean)
- classes: Classes CSS à appliquer (Array)

##### Formatage
- formatter: Type de formatage à appliquer
  - :date - Format date (DD/MM/YYYY)
  - :datetime - Format date et heure
  - :currency - Format monétaire
  - :percentage - Format pourcentage
  - :helper - Utilise un helper personnalisé
  - :indicator - Affiche un indicateur visuel
- :link - Transforme en lien cliquable
format_params: Paramètres additionnels pour le formatter

```ruby
# Exemple avec helper
{
header: "Occupant",
method: :id,
formatter: :helper,
format_params: [:locker_participant]
}
# Exemple avec link
{
header: "Nom",
method: :name,
formatter: :link,
format_params: [:site_path, :id]
}
```
##### Types spéciaux
- type: Type spécial de colonne
  - :indicator - Pour les statuts/badges
  - :link - Pour les colonnes cliquables
  - :checkbox - Pour les cases à cocher
  - :action - Pour les boutons d'action
  - :date - Pour les dates (ajoute des classes spécifiques)
  - :status - Pour les statuts
  - :name - Pour les noms (ajoute des classes spécifiques)

##### Responsivité
```ruby
{
header: "Email",
method: :email,
responsive: {
mobile: "hide",
tablet: "hide"
}
}
```
#### Exemples d'utilisation
##### Colonne simple avec tri
```ruby
{
header: "Nom",
method: :full_name,
sortable: true,
classes: ["col-lg-3"]
}
```
##### Colonne avec formatage de date
```ruby
{
header: "Date création",
method: :created_at,
formatter: :date,
sortable: true,
classes: ["col-lg-2", "text-align-center"]
}
```

#### Pagination
- `initial_per_page`: Nombre d'éléments par page au chargement
- `per_page_options`: Options de nombre d'éléments par page

#### Recherche
- `searchable`: Permet la recherche (true/false)

#### Filtres par tags
- `tags`: Permet les filtres par tags

``` ruby
@dataset.tags = [
  {
    title: "Catégorie",
    method_value: :category_value,
    method_name: :category_name
  }
]
```


## Exemple complet
``` ruby
@dataset = DataTables::MasheDataTable.new()
@dataset.title = "Liste des utilisateurs"
@dataset.rows = User.all
@dataset.searchable = true
@dataset.pagination = { initial_per_page: 10, per_page_options: [10, 25, 50] }
@dataset.columns = [
  {
    header: "Nom",
    method: :full_name,
    sortable: true,
    classes: ["col-lg-3"]
  },
  {
    header: "Email",
    method: :email,
    sortable: true,
    classes: ["col-lg-3"]
  },
  {
    header: "Statut",
    method: :status,
    type: :indicator,
    classes: ["col-lg-2"]
  },
  {
    header: "Date création",
    method: :created_at,
    formatter: :date,
    sortable: true,
    classes: ["col-lg-2"]
  }
  ]
@dataset.tags = [
  {
    title: "Statut",
    method_value: :status_value,
    method_name: :status_name
  }
]
@dataset.build_hash
```

### Actions dans MasheDataTable
#### Configuration de base
Les actions apparaissent sous forme de menu déroulant à la fin de chaque ligne. Voici comment les configurer :

``` ruby
dataset.actions = [
  {
    link: {
      content: "Voir le détail",
      path: :resource_path,
      args: ["self"]
    }
  }
]
```

#### Options disponibles
##### Configuration du lien
- content: Texte du lien
- path: Helper de route Rails
- args: Arguments positionnels pour la route
- kwargs: Arguments nommés pour la route
- method: Méthode HTTP (:get, :post, :patch, etc.)
- turbo_stream: Active Turbo Stream (boolean)
- turbo_method: Méthode Turbo
- turbo_confirm: Message de confirmation

##### Conditions d'affichage
- conditions: Tableau de conditions pour afficher l'action
- method: Méthode à appeler sur l'objet
- value: Valeur attendue

#### Exemples d'utilisation
##### Action simple de visualisation
``` ruby
dataset.actions = [
  {
    link: {
      content: "Voir le détail",
      path: :site_locker_path,
      args: [@site, "self"]
    }
  }
]
```
#### Action avec confirmation et Turbo
``` ruby
dataset.actions = [
  {
    link: {
      content: "Supprimer",
      path: :delete_resource_path,
      args: ["self"],
      method: :delete,
      turbo_stream: true,
      turbo_method: :delete,
      turbo_confirm: "Êtes-vous sûr de vouloir supprimer ?"
    }
  }
]
```

#### Action conditionnelle
``` ruby
dataset.actions = [
  {
    link: {
      content: "Valider",
      path: :validate_resource_path,
      args: ["self"],
      method: :patch
    },
    conditions: [
      { method: :status, value: "pending" }
    ]
  }
]
```

#### Actions en masse
``` ruby
dataset.actions = [
  {
    link: {
      content: "Vider le casier",
      path: :empty_site_locker_path,
      args: [@site.id, "self"],
      method: :patch,
      turbo_stream: true,
      turbo_method: :patch,
      turbo_confirm: "Voulez-vous vraiment vider le casier ?",
    },
    conditions: [{ method: :status_value, value: true }]
  },
  {
    link: {
      content: "Signaler un dégât",
      path: :new_site_locker_damage_path,
      args: [@site.id],
      kwargs: { locker_id: :id },
      turbo_stream: true
    }
  },
  {
    link: {
      content: "Voir le casier",
      path: :site_locker_path,
      args: [@site, "self"]
    }
  }
]
```

#### Actions avec arguments nommés
``` ruby
dataset.actions = [
  {
    link: {
      content: "Voir le détail",
      path: :site_locker_path,
      kwargs: { locker_id: :id }
    }
  }
]
```

#### Notes importantes
1. L'argument "self" est remplacé par l'ID de l'objet courant :
```ruby
args: [@site, "self"]
```

2. Les conditions désactivent visuellement le lien si non remplies :
```ruby
conditions: [
  { method: :status_value, value: true },
  { method: :active?, value: true }
]
```
