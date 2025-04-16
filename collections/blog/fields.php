<?php
// config/fields.php
// Configuration for custom fields in the Minimal CMS

return [

    // Editor field in main area
    // Para ocultar el editor debemos comentar este código
    [
        'name' => 'editor',
        'label' => '',
        'location' => 'main',
        'type' => 'editor',
    ],

    // Ejemplo de campos estructurados en el área principal
    // [
    //     'name' => 'property_title',
    //     'label' => 'Título de la Propiedad',
    //     'location' => 'main',
    //     'type' => 'text',
    // ],
    // [
    //     'name' => 'property_price',
    //     'label' => 'Precio',
    //     'location' => 'main',
    //     'type' => 'text',
    // ],

    // Example textarea field in right sidebar
    [
        'name' => 'excerpt',
        'label' => 'Meta Description - Excerpt',
        'location' => 'right',
        'type' => 'textarea',
    ],

    // Date field in left sidebar
    [
        'name' => 'publish_date',
        'label' => 'Publish Date',
        'location' => 'right',
        'type' => 'date',
        'format' => 'YYYY-MM-DD' // ISO format for dates
    ],

    // Example select field in right sidebar
    [
        'name' => 'status',
        'label' => 'Publication Status',
        'location' => 'right',
        'type' => 'select',
        'default' => 'published',
        'options' => [
            'draft' => 'Draft',
            'published' => 'Published',
            'archived' => 'Archived'
        ]
    ],

    // Gallery field in right sidebar
    [
        'name' => 'gallery',
        'label' => 'Image Gallery',
        'location' => 'right',
        'type' => 'gallery',
        'description' => 'Select multiple images for the gallery'
    ],

    [
        'name' => 'tags',
        'label' => 'Tags',
        'location' => 'right',
        'type' => 'tags',
        'description' => 'Add tags to categorize your content'
    ],

    [
        'name' => 'category',
        'label' => 'Category',
        'location' => 'right',
        'type' => 'select',
        'options' => [
            'blog' => 'Blog',
            'featured' => 'Featured'
        ]
    ],
    
    // Ejemplo de campo checkbox
    [
        'name' => 'featured',
        'label' => 'Destacado',
        'location' => 'right',
        'type' => 'checkbox',
        'default' => 'false',
        'description' => 'Marcar como artículo destacado'
    ],
    
    // Ejemplo de campo checkbox sin valor por defecto
    [
        'name' => 'comments_enabled',
        'label' => 'Comentarios',
        'location' => 'right',
        'type' => 'checkbox',
        'description' => 'Permitir comentarios en este artículo'
    ],
    
    // Ejemplo de campo número
    [
        'name' => 'price',
        'label' => 'Precio',
        'location' => 'right',
        'type' => 'number',
        'min' => 0,
        'max' => 999999,
        'step' => 0.01,
        'description' => 'Precio del producto o servicio'
    ],

    // Add more fields as needed
];
