module.exports = {
    template: 'awesome-cv',
    entryLimit: 10,
    charCutoff: 100,
    placeholder: 'Je bent dit veld vergeten in te vullen',
    err: {
        occupied: 'Het lijkt erop dat de server nog bezig is met uw vorige aanvraag. Probeer het alstublieft later nog eens.\nBedankt voor uw begrip.',
        compile: 'Het lijkt erop dat uw aanvraag niet correct is afgehandeld, dit is waarschijnlijk een fout van de server. Probeer het alstublieft later nog eens.\nBedankt voor uw begrip.'
    },
    accountManagement: {
        loggedIn: { html: 'Log uit', href: '/loguit' },
        loggedOut: { html: 'Log in', href: '/login' }
    },
    impatienceMock: ['Even geduld a.u.b.', 'Nog heel even', 'Wat zeg ik nou', 'We doen echt ons best', 'Jaja', 'We begrijpen het nu wel', 'Vaak klikken maakt het niet sneller', 'Even geduld a.u.b.'],
    categories: ['template', 'general', 'education', 'experience', 'internship'],
    general: {
        properties: ['first_name', 'last_name', 'title', 'location', 'address', 'postal_code', 'city', 'province', 'phone', 'email', 'website', 'birthday', 'nationality', 'marital_status'],
        first_name: 'Jesse',
        last_name: 'de Jong',
        title: 'Student kok',
        location: 'Amsterdam',
        address: 'Kerkstraat 7',
        postal_code: '1234 AB',
        city: 'Amsterdam',
        province: 'Noord-Holland',
        phone: '(+31) 6 12 345 789',
        email: 'jesse@voorbeeld.nl',
        website: 'voorbeeld.nl',
        birthday: '1 januari 1994',
        nationality: 'Nederlandse',
        marital_status: 'Ongehuwd'
    },
    education: {
        properties: ['education_name', 'education_city', 'education_course', 'education_timespan', 'education_property0', 'education_property1', 'education_property2'],
        education_name: ['ROC van Amsterdam', 'TIO University of Applied Science'],
        education_city: ['Amsterdam', 'Amsterdam'],
        education_course: ['Opleiding tot kok', 'HBO Hogere hotelschool'],
        education_timespan: ['2010 - 2013', '2013 - 2017'],
        education_property0: ['MBO-4 opleiding', 'Hotel- en evenementmanager'],
        education_property1: ['', ''],
        education_property2: ['', '']
    },
    experience: {
        properties: ['experience_name', 'experience_city', 'experience_function', 'experience_timespan', 'experience_property0', 'experience_property1', 'experience_property2'],
        experience_name: ['Albert Heijn', 'Domino\'s Pizza'],
        experience_city: ['Amsterdam', 'Amsterdam'],
        experience_function: ['Cassière', 'Pizzachef'],
        experience_timespan: ['2010 - 2012', '2009 - 2010'],
        experience_property0: ['Cassière, verantwoordelijkheid over filiaal bij opening en sluiting', 'Bereiden pizza\'s, behandeling bestellingen'],
        experience_property1: ['', ''],
        experience_property2: ['', '']
    },
    internship: {
        properties: ['internship_category', 'internship_timespan', 'internship_name', 'internship_city', 'internship_function'],
        internship_category: ['Nederland', 'Nederland', 'Curaçao'],
        internship_timespan: ['2010', '2012', '2013'],
        internship_name: ['Mercure hotel', 'Pelikaan Hotel', 'Pelikaan Hotel'],
        internship_city: ['Amsterdam', 'Amsterdam', 'Willemstad'],
        internship_function: ['Kok (10 weken)', 'Kok (20 weken)', 'Bediening']
    }
};