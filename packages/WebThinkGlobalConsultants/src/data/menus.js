export const menuMain = [
    {
        name: "Home",
        url: "/",
        highlighted: false,
    },
    {
        name: "About Us",
        url: "/about-us",
        highlighted: false,
    },
    {
        name: "Our Services",
        items: [
            {name:"PRISM", url:"/prism", highlighted: false,},
            {name:"CQ for Schools", url:"/cq-for-schools", highlighted: false,},
        ],
        
    },
    {
        name: "Our Customers",
        items: [
            {name:"Businesses/ Global Organizations", url:"/businesses-global-organizations", highlighted: false,},
            {name:"International Schools", url:"/international-schools", highlighted: false,},
            {name:"NGOs/ Nonprofits", url:"/ngos-nonprofits", highlighted: false,},
        ],
    },
    {
        name: "Insights",
        url: "/insights",
        highlighted: false,
    },
    {
        name: "Contact",
        url: "/contact",
        highlighted: false,
    },
    {
        name: "Request Consultation",
        url: "/contact",
        highlighted: true,
    },
];

export const footerPrimary = [
    {
        title: "Navigatie",
        items: [
            { name: "home", url: "/" },
        ],
    },
];

export const footerSecondary = [
    {
        title: "support",
        items: [
            { name: "pricing", url: "/pricing" },
        ],
    },
];

export const footerTertiary = [
    {
        title: "Links",
        items: [
            { name: "privacybeleid", url: '/privacy-policy' },
            { name: "api status", url: "/api-status" },
        ],
    },
];
