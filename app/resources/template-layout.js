module.exports = {
    /*
     * Awesome CV by posquit0
     */
    'awesome-cv': {
        general: {
            begin: `
\\documentclass[11pt, a4paper]{awesome-cv}
\\geometry{left=1.4cm, top=.8cm, right=1.4cm, bottom=1.8cm, footskip=.5cm}
\\setbool{acvSectionColorHighlight}{true}
\\name{general:first_name}{general:last_name}
\\position{general:location{\\enskip\\cdotp\\enskip}general:title}
\\address{general:address, general:postal_code, general:city, general:province}
\\mobile{general:phone}
\\email{general:email}
\\homepage{general:website}
\\quote{Geboren: general:birthday{\\enskip\\cdotp\\enskip}Nationaliteit: general:nationality{\\enskip\\cdotp\\enskip}Burgelijke staat: general:marital_status}
\\begin{document}
\\makecvheader[C]
\\makecvfooter
\t{\\today}
\t{general:first_name general:last_name~~~·~~~Curriculum Vitae}
\t{\\thepage}
            `,
            loop: false,
            end: false
        },
        education: {
            begin: `
\\cvsection{Opleiding}
\\begin{cventries}
            `,
            loop: `
\\cventry
{education:education_course}
{education:education_name}
{education:education_city}
{education:education_timespan}
{
\\begin{cvitems}
\t\\item{education:education_property0}
$do:optional$education:education_property1$\t\\item{education:education_property1}
$do:optional$education:education_property2$\t\\item{education:education_property2}
\\end{cvitems}
}
            `,
            end: `
\\end{cventries}
            `
        },
        experience: {
            begin: `
\\cvsection{Ervaring}
\\begin{cventries}
            `,
            loop: `
\\cventry
{experience:experience_function}
{experience:experience_name}
{experience:experience_city}
{experience:experience_timespan}
{
\\begin{cvitems}
\t\\item{experience:experience_property0}
$do:optional$experience:experience_property1$\t\\item{experience:experience_property1}
$do:optional$experience:experience_property2$\t\\item{experience:experience_property2}
\\end{cvitems}
}
            `,
            end: `
\\end{cventries}
            `
        },
        internship: {
            begin: `
\\cvsection{Stageplekken}
            `,
            loop: `
$do:unique$internship:internship_category$@\\end{cvhonors}@\\cvsubsection{internship:internship_category}\\begin{cvhonors}
\t\\cvhonor
\t\t{internship:internship_function}
\t\t{internship:internship_name}
\t\t{internship:internship_city}
\t\t{internship:internship_timespan}
            `,
            end: `
\\end{cvhonors}
\\end{document}
            `
        }
    }
};