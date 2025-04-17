<?php
// config/fields.php
// Configuration for custom fields in the Minimal CMS

return [

    // Editor field in main area
    // Para ocultar el editor debemos comentar este código
    // [
    //     'name' => 'editor',
    //     'label' => '',
    //     'location' => 'main',
    //     'type' => 'editor',
    // ],

    // Ejemplo de campos estructurados en el área principal
    [
        'name' => 'project_title',
        'label' => 'Título del Proyecto',
        'location' => 'main',
        'type' => 'text',
    ],
    [
        'name' => 'project_text',
        'label' => 'Texto del Proyecto',
        'location' => 'main',
        'type' => 'textarea',
    ],

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
        'location' => 'main',
        'type' => 'date',
        'format' => 'YYYY-MM-DD' // ISO format for dates
    ],

    // Example select field in right sidebar
    [
        'name' => 'status',
        'label' => 'Publication Status',
        'location' => 'main',
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
        'location' => 'main',
        'type' => 'gallery',
        'description' => 'Select multiple images for the gallery'
    ],

    // [
    //     'name' => 'tags',
    //     'label' => 'Tags',
    //     'location' => 'right',
    //     'type' => 'tags',
    //     'description' => 'Add tags to categorize your content'
    // ],

    [
        'name' => 'category',
        'label' => 'Category',
        'location' => 'main',
        'type' => 'select',
        'options' => [
            'blog' => 'Blog',
            'featured' => 'Featured'
        ]
    ],

    [
        'name' => 'mobile_image',
        'label' => 'Imagen Mobile',
        'location' => 'main',
        'type' => 'image',
        'description' => 'Selecciona una imagen.'
    ],

    [
        'name' => 'desktop_image',
        'label' => 'Imagen Desktop',
        'location' => 'main',
        'type' => 'image',
        'description' => 'Selecciona una imagen.'
    ],

    // Add more fields as needed
];
