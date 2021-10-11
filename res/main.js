const COLORS = ["#4caf50", "#7ec47b", "#aad8a6", "#d5ecd2", "#ffffff", "#ffd4c9", "#ffa896", "#ff7a65", "#f44336"];
const COLOR_GREEN = { rgb: [76, 175, 80], hex: "#4caf50" };
const COLOR_RED = { rgb: [244, 67, 54], hex: "#f44336" };
const COLOR_YELLOW = { rgb: [255, 235, 59], hex: "#ffeb3b" };
const COLOR_GRAY = "#71717161";

const START_DATE_PARSED = Date.parse('2021-01-27');
const START_WEEK = 202104;

const API_URL = "https://www.covid19.admin.ch/api/data/context";

const JSON_PATH = "sources.individual.json.";
const AGE_GROUP_PATH = JSON_PATH + "weekly.byAge.";
const BY_SEX_PATH = JSON_PATH + "weekly.bySex.";
const DAILY_PATH = JSON_PATH + "daily.";

const VACC_PERSONS_PATH = JSON_PATH + "weeklyVacc.byIndication.fullyVaccPersonsV2";

const CASE_AG_PATH = AGE_GROUP_PATH + "casesVaccPersons";
const HOSP_AG_PATH = AGE_GROUP_PATH + "hospVaccPersons";
const DEATH_AG_PATH = AGE_GROUP_PATH + "deathVaccPersons";

const CASE_VACC_PATH = DAILY_PATH + "casesVaccPersons";
const HOSP_VACC_PATH = DAILY_PATH + "hospVaccPersons";
const DEATH_VACC_PATH = DAILY_PATH + "deathVaccPersons";

const CASE_PATH = DAILY_PATH + "cases";
const HOSP_PATH = DAILY_PATH + "hosp";
const DEATH_PATH = DAILY_PATH + "death";

const CASE_WEEKLY_PATH = JSON_PATH + "weekly.default.cases";
const HOSP_WEEKLY_PATH = JSON_PATH + "weekly.default.hosp";
const DEATH_WEEKLY_PATH = JSON_PATH + "weekly.default.death";
const CASE_VACC_SEX_PATH = BY_SEX_PATH + "casesVaccPersons";
const HOSP_VACC_SEX_PATH = BY_SEX_PATH + "hospVaccPersons";
const DEATH_VACC_SEX_PATH = BY_SEX_PATH + "deathVaccPersons";


const vacc_cases_ctx = document.getElementById('vacc_cases').getContext('2d');
const vacc_hosps_ctx = document.getElementById('vacc_hosps').getContext('2d');
const vacc_deaths_ctx = document.getElementById('vacc_deaths').getContext('2d');
const vacc_cases_ag_ctx = document.getElementById('vacc_cases_ag').getContext('2d');
const vacc_hosps_ag_ctx = document.getElementById('vacc_hosps_ag').getContext('2d');
const vacc_deaths_ag_ctx = document.getElementById('vacc_deaths_ag').getContext('2d');

const case_efficacy_pie_ctx = document.getElementById('case_pie').getContext('2d');
const hosp_efficacy_pie_ctx = document.getElementById('hosp_pie').getContext('2d');
const death_efficacy_pie_ctx = document.getElementById('death_pie').getContext('2d');
const efficacy_timeline_ctx = document.getElementById('efficacy_timeline').getContext('2d');

const range_track_ui = document.getElementsByClassName("range-input-track")[0];
const range_ui = document.getElementsByClassName("range-input-range")[0];
const thumb_left_ui = document.getElementsByClassName("range-input-thumb-left")[0];
const thubb_right_ui = document.getElementsByClassName("range-input-thumb-right")[0];
const min_input_ui = document.getElementById("min-input");
const max_input_ui = document.getElementById("max-input");
const min_value_ui = document.getElementById("value-min");
const max_value_ui = document.getElementById("value-max");

const total_cases_sum_ui = document.getElementById('total_cases_sum');
const vacc_cases_sum_ui = document.getElementById('vacc_cases_sum');
const case_efficacy_ui = document.getElementById("case_efficacy");
const total_hosps_sum_ui = document.getElementById('total_hosps_sum');
const vacc_hosps_sum_ui = document.getElementById('vacc_hosps_sum');
const hosp_efficacy_ui = document.getElementById("hosp_efficacy");
const total_deaths_sum_ui = document.getElementById('total_deaths_sum');
const vacc_deaths_sum_ui = document.getElementById('vacc_deaths_sum');
const death_efficacy_ui = document.getElementById("death_efficacy");
const status_info_ui = document.getElementById("status_info");


var dataset_vacc_persons = [];
var dataset_cases = [];
var dataset_hosps = [];
var dataset_deaths = [];
var dataset_vacc_cases = [];
var dataset_vacc_hosps = [];
var dataset_vacc_deaths = [];
var dataset_vacc_cases_ag = [];
var dataset_vacc_hosps_ag = [];
var dataset_vacc_deaths_ag = [];
var dataset_vacc_cases_weekly = [];
var dataset_vacc_hosps_weekly = [];
var dataset_vacc_deaths_weekly = [];
var dataset_cases_weekly = [];
var dataset_hosps_weekly = [];
var dataset_deaths_weekly = [];
var dataset_efficacy_cases = [];
var dataset_efficacy_hosps = [];
var dataset_efficacy_deaths = [];
var dates = [];

var case_efficacy_pie_chart;
var hosp_efficacy_pie_chart;
var death_efficacy_pie_chart;
var efficacy_chart;
var cases_chart;
var hosps_chart;
var deaths_chart;
var cases_ag_chart;
var hosps_ag_chart;
var deaths_ag_chart;

var request_status = {
    api_request: false,
    vacc_persons_request: false,

    case_ag_request: false,
    hosp_ag_request: false,
    death_ag_request: false,

    case_vacc_request: false,
    hosp_vacc_request: false,
    death_vacc_request: false,

    case_request: false,
    hosp_request: false,
    death_request: false,

    case_weekly_request: false,
    hosp_weekly_request: false,
    death_weekly_request: false,

    case_vacc_sex_request: false,
    hosp_vacc_sex_request: false,
    death_vacc_sex_request: false,
}

// ---------------- GENERAL FUNCTIONS ---------------- //

function path_lookup(obj, path) {
    parts = path.split(".");
    if (parts.length == 1) {
        return obj[parts[0]];
    }
    return path_lookup(obj[parts[0]], parts.slice(1).join("."));
}

function number_with_commas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

function group_by(xs, key) {
    return xs.reduce((rv, x) => {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

function group_by_sum(array, match_key, sum_key) {
    var result = [];
    array.reduce((res, value) => {
        if (!res[value[match_key]]) {
            res[value[match_key]] = { [match_key]: value[match_key], [sum_key]: 0 };
            result.push(res[value[match_key]])
        }
        res[value[match_key]][sum_key] += value[sum_key];
        return res;
    }, {});
    return result;
}


function component_to_hex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgb_to_hex(r, g, b) {
    return "#" + component_to_hex(r) + component_to_hex(g) + component_to_hex(b);
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

function value_to_color(val, max_val, min_c, max_c) {
    let t = val / max_val;
    let r = Math.floor(lerp(min_c[0], max_c[0], t));
    let g = Math.floor(lerp(min_c[1], max_c[1], t));
    let b = Math.floor(lerp(min_c[2], max_c[2], t));
    return rgb_to_hex(r, g, b);
}

function convert_to_ch(date) {
    return new Date(date).toLocaleDateString("de-CH").replaceAll("/", ".");
}


function build_status_box() {
    Object.keys(request_status).forEach(el => {
        let elem = document.createElement("span");
        elem.className = "req-status";
        elem.id = el;
        status_info_ui.appendChild(elem);
    });
}

function set_status_value(key) {
    request_status[key] = true;
    document.getElementById(key).classList.add("completed");
    let finished_sum = Object.entries(request_status).map(([, el]) => el).reduce((acc, val) => val ? acc + 1 : 0, 0);

    if (finished_sum === Object.keys(request_status).length) {
        status_info_ui.classList.add("completed");
        setTimeout(() => { status_info_ui.style.display = "none"; }, 1000);
    }
}


function build_chart(ctx, data, label) {
    var case_max = Math.max(...data.map(el => el.entries));
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(el => convert_to_ch(el.date)),
            datasets: [{
                label: label,
                data: data.map(el => el.entries),
                backgroundColor: data.map(el => value_to_color(el.entries, case_max, COLOR_GREEN.rgb, COLOR_RED.rgb))
            }],
        },
        options: {
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    beginAtZero: true,
                }
            }
        }
    });
    return myChart;
}
function build_chart_ag(ctx, data) {
    let grouped_data = group_by(data, "altersklasse_covid19");
    let dataset = [];

    Object.entries(grouped_data).forEach(([key, value], index) => {
        if (key == 'Unbekannt') return;
        dataset.push({
            label: value[0].altersklasse_covid19,
            data: value.map(el => el.entries),
            backgroundColor: COLORS[index]
        });
    });

    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(group_by(data, "date")).map(el => parseInt(el)),
            datasets: dataset
        },
        options: {
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    beginAtZero: true,
                    stacked: true
                }
            }
        }
    });

    return myChart;
}

function build_pie(ctx, data) {
    let color = value_to_color(data[0], data[0] + data[1], COLOR_GREEN.rgb, COLOR_RED.rgb);
    var myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: data,
                backgroundColor: [COLOR_GRAY, color],
                borderWidth: 0,
                cutout: "95%"
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
            }
        }
    });

    return myChart;
}




// ---------------- TIMELINE ---------------- //

function build_timeline_chart() {
    efficacy_chart = new Chart(efficacy_timeline_ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: "Efficacy Cases",
                data: [],
                backgroundColor: COLOR_GREEN.hex,
                borderColor: COLOR_GREEN.hex,
            },
            {
                label: "Efficacy Hospitalizations",
                data: [],
                backgroundColor: COLOR_YELLOW.hex,
                borderColor: COLOR_YELLOW.hex,
            },
            {
                label: "Efficacy Deaths",
                data: [],
                backgroundColor: COLOR_RED.hex,
                borderColor: COLOR_RED.hex,
                hidden: true
            }]
        },
        options: {
            scales: {
                y: {
                    //suggestedMin: 70,
                }
            }
        }
    });
}
function set_timeline_chart_data(index, data) {
    efficacy_chart.data.datasets[index].data = data.map(el => el.efficacy);
    efficacy_chart.data.labels = data.map(el => el.date);
    efficacy_chart.update();
}
function update_timeline_chart_range(week_min, week_max) {
    efficacy_chart.options.scales.x = {
        min: week_min,
        max: week_max
    };
    efficacy_chart.update();
}




// ---------------- EFFICACY CHART ---------------- //

function build_efficacy_chart(ctx) {
    var chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [],
                backgroundColor: [COLOR_GRAY, COLOR_GREEN],
                borderWidth: 0,
                cutout: "95%"
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
            }
        }
    });

    return chart;
}
function set_efficacy_chart_data(chart, percent) {
    chart.data.datasets[0].data = [100 - percent, percent];
    chart.data.datasets[0].backgroundColor[1] = value_to_color(percent, 100, COLOR_RED.rgb, COLOR_GREEN.rgb);
    chart.update();
}



function update_summary_absolute(vacc_dataset, total_dataset, min_parsed, max_parsed, total_sum_ui, vacc_sum_ui) {
    let vacc = vacc_dataset.filter(el => (el.parse_date >= min_parsed && el.parse_date <= max_parsed)).reduce((acc, val) => acc + val.entries, 0);
    let total = total_dataset.filter(el => (el.parse_date >= min_parsed && el.parse_date <= max_parsed)).reduce((acc, val) => acc + val.entries, 0);

    total_sum_ui.innerText = number_with_commas(total);
    vacc_sum_ui.innerText = number_with_commas(vacc);
}

function update_summary_efficacy(chart, dataset_efficacy, min_parsed, max_parsed, efficacy_ui) {
    let min_week = dates.weeks[dates.parsed.findIndex(el => el == min_parsed)];
    let max_week = dates.weeks[dates.parsed.findIndex(el => el == max_parsed)];

    let { week_vacc, week_unvacc, efficacy } = calculate_efficacy_average(dataset_efficacy, min_week, max_week);

    efficacy_ui.innerText = parseFloat(efficacy.toFixed(1)) + "%";
    let eff_int = parseInt(efficacy);
    set_efficacy_chart_data(chart, eff_int);
}

function build_absolute(vacc_dataset, total_dataset, total_sum_ui, vacc_sum_ui) {
    if (vacc_dataset.length && total_dataset.length) {
        update_summary_absolute(vacc_dataset, total_dataset, START_DATE_PARSED, dates.parsed[dates.parsed.length - 1], total_sum_ui, vacc_sum_ui);
    }
}


function build_efficacy(chart, vacc_weekly, total_weekly, efficacy_ui, index) {
    if (total_weekly.length && vacc_weekly.length) {
        let dataset_efficacy = generate_efficacy_dataset(vacc_weekly, total_weekly, START_WEEK, dates.weeks[dates.weeks.length - 1]);

        update_summary_efficacy(chart, dataset_efficacy, START_DATE_PARSED, dates.parsed[dates.parsed.length - 1], efficacy_ui);

        set_timeline_chart_data(index, dataset_efficacy);

        if (dataset_efficacy == dataset_cases_weekly) {
            setTimeout(() => {
                var favicon = document.getElementById('favicon');
                var canvas = document.getElementById('case_pie');
                favicon.href = canvas.toDataURL('image/png');
            }, 1000);
        }

        return dataset_efficacy;
    }
}

function get_iso_week(date) {
    var d = new Date(date);
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return parseInt(d.getFullYear() + String(Math.ceil((((d - yearStart) / 86400000) + 1) / 7)).padStart(2, '0'));
}

function update_range() {
    let min_val = parseInt(min_input_ui.value);
    let max_val = parseInt(max_input_ui.value);

    let min_date = dates.ch[min_val];
    let max_date = dates.ch[max_val];

    let min_date_int = dates.parsed[min_val];
    let max_date_int = dates.parsed[max_val];

    let min_week = dates.weeks[min_val];
    let max_week = dates.weeks[max_val];

    cases_chart.options.scales.x = {
        min: min_date,
        max: max_date,
        stacked: true,
    };
    cases_chart.update();

    hosps_chart.options.scales.x = {
        min: min_date,
        max: max_date,
        stacked: true,
    };
    hosps_chart.update();

    deaths_chart.options.scales.x = {
        min: min_date,
        max: max_date,
        stacked: true,
    };
    deaths_chart.update();

    cases_ag_chart.options.scales.x = {
        min: min_week,
        max: max_week,
        stacked: true,
    };
    cases_ag_chart.update();

    hosps_ag_chart.options.scales.x = {
        min: min_week,
        max: max_week,
        stacked: true,
    };
    hosps_ag_chart.update();

    deaths_ag_chart.options.scales.x = {
        min: min_week,
        max: max_week,
        stacked: true,
    };
    deaths_ag_chart.update();

    update_summary_absolute(dataset_vacc_cases, dataset_cases, min_date_int, max_date_int, total_cases_sum_ui, vacc_cases_sum_ui);
    update_summary_absolute(dataset_vacc_hosps, dataset_hosps, min_date_int, max_date_int, total_hosps_sum_ui, vacc_hosps_sum_ui);
    update_summary_absolute(dataset_vacc_deaths, dataset_deaths, min_date_int, max_date_int, total_deaths_sum_ui, vacc_deaths_sum_ui);

    update_summary_efficacy(case_efficacy_pie_chart, dataset_efficacy_cases, min_date_int, max_date_int, case_efficacy_ui);
    update_summary_efficacy(hosp_efficacy_pie_chart, dataset_efficacy_hosps, min_date_int, max_date_int, hosp_efficacy_ui);
    update_summary_efficacy(death_efficacy_pie_chart, dataset_efficacy_deaths, min_date_int, max_date_int, death_efficacy_ui);

    update_timeline_chart_range(min_week, max_week);
}


function generate_dates(data, api_out) {
    if (dates.length !== 0) return;

    data = data.filter(el => START_DATE_PARSED <= Date.parse(el.date) && el.geoRegion === "CHFL" && el.vaccine === "all" && el.vaccination_status === "fully_vaccinated")
    dates = {
        parsed: data.map(el => Date.parse(el.date)),
        ch: data.map(el => convert_to_ch(el.date)),
        weeks: data.map(el => get_iso_week(el.date)),
    }
    min_input_ui.max = dates.ch.length - 1;
    max_input_ui.max = dates.ch.length - 1;
    max_input_ui.value = dates.ch.length - 1;
    min_value_ui.innerHTML = dates.ch[min_input_ui.value];
    max_value_ui.innerHTML = dates.ch[max_input_ui.value];

    dates.weeks.forEach((el, i) => {
        let elem = document.createElement("span");
        if (i !== 0 && dates.weeks[i - 1] !== el) {
            elem.className = "mark";
            let week_num = document.createElement("p");
            week_num.className = "week-mark-text";
            week_num.innerText = el.toString().substring(4);
            elem.appendChild(week_num);
        }
        range_track_ui.appendChild(elem);
    });

    fetch_date_dependents(api_out);
}

function generate_efficacy_dataset(vacc_data, tot_data, week_min, week_max) {
    vacc_data = vacc_data.filter(el => (el.date >= week_min && el.date <= week_max));
    tot_data = tot_data.filter(el => (el.date >= week_min && el.date <= week_max));
    let vacc_stats = dataset_vacc_persons.filter(el => (el.date >= week_min && el.date <= week_max));

    let ret = [];
    vacc_data.forEach((el, i) => {
        if (vacc_stats[i].date != tot_data[i].date || vacc_stats[i].date != vacc_stats[i].date) console.log("PROBLEM:", i);
        let vacc_persons = vacc_stats[i].sumTotal;
        let unvacc_persons = tot_data[i].pop - vacc_stats[i].sumTotal;
        let vacc_cases = el.entries;
        let unvacc_cases = tot_data[i].entries - el.entries;
        let RR = (vacc_cases / vacc_persons * 100) / (unvacc_cases / unvacc_persons * 100);
        let VE = Math.max((1 - RR) * 100, 0);
        ret.push({
            date: el.date,
            vacc_cases,
            vacc_persons,
            unvacc_cases,
            unvacc_persons,
            efficacy: VE
        })
    })
    return ret;
}

function calculate_efficacy_average(dataset, week_min, week_max) {
    dataset = dataset.filter(el => (el.date >= week_min && el.date <= week_max));
    let weight = 1 / dataset.length;
    return {
        vacc: dataset.reduce((acc, el) => acc + el.vacc_cases, 0),
        unvacc: dataset.reduce((acc, el) => acc + el.unvacc_cases, 0),
        efficacy: dataset.reduce((acc, el) => acc + el.efficacy * weight, 0)
    }
}


function fetch_date_dependents(api_out) {

    fetch(path_lookup(api_out, CASE_PATH))
        .then(res => res.json())
        .then(out => {
            set_status_value("case_request");
            dataset_cases = out.filter(el => START_DATE_PARSED <= Date.parse(el.datum) && el.geoRegion === "CHFL" && el.vaccine === "all" && el.vaccination_status === "fully_vaccinated");
            dataset_cases = dataset_cases.map(el => ({
                date: convert_to_ch(el.datum),
                parse_date: Date.parse(el.datum),
                entries: el.entries
            }));
            let data = {
                label: 'Total',
                data: dataset_cases.map(el => el.entries),
                backgroundColor: COLOR_GRAY,
                hidden: true
            }

            cases_chart.data.datasets.push(data);
            cases_chart.update();

            build_absolute(dataset_vacc_cases, dataset_cases, total_cases_sum_ui, vacc_cases_sum_ui);
        })
        .catch(err => { console.log(err) });

    fetch(path_lookup(api_out, HOSP_PATH))
        .then(res => res.json())
        .then(out => {
            set_status_value("hosp_request");
            dataset_hosps = out.filter(el => START_DATE_PARSED <= Date.parse(el.datum) && el.geoRegion === "CHFL" && el.vaccine === "all" && el.vaccination_status === "fully_vaccinated");
            dataset_hosps = dataset_hosps.map(el => ({
                date: convert_to_ch(el.datum),
                parse_date: Date.parse(el.datum),
                entries: el.entries
            }));
            let data = {
                label: 'Total',
                data: dataset_hosps.map(el => el.entries),
                backgroundColor: COLOR_GRAY,
                hidden: true
            }

            hosps_chart.data.datasets.push(data);
            hosps_chart.update();


            build_absolute(dataset_vacc_hosps, dataset_hosps, total_hosps_sum_ui, vacc_hosps_sum_ui);
        })
        .catch(err => { console.log(err) });
    fetch(path_lookup(api_out, DEATH_PATH))
        .then(res => res.json())
        .then(out => {
            set_status_value("death_request");
            dataset_deaths = out.filter(el => START_DATE_PARSED <= Date.parse(el.datum) && el.geoRegion === "CHFL" && el.vaccine === "all" && el.vaccination_status === "fully_vaccinated");
            dataset_deaths = dataset_deaths.map(el => ({
                date: convert_to_ch(el.datum),
                parse_date: Date.parse(el.datum),
                entries: el.entries
            }));
            let data = {
                label: 'Total',
                data: dataset_deaths.map(el => el.entries),
                backgroundColor: COLOR_GRAY,
                hidden: true
            }

            deaths_chart.data.datasets.push(data);
            deaths_chart.update();

            build_absolute(dataset_vacc_deaths, dataset_deaths, total_deaths_sum_ui, vacc_deaths_sum_ui);
        })
        .catch(err => { console.log(err) });



    fetch(path_lookup(api_out, CASE_WEEKLY_PATH))
        .then(res => res.json())
        .then(out => {
            set_status_value("case_weekly_request");
            dataset_cases_weekly = out.filter(el => el.geoRegion === "CHFL" && el.vaccine === "all" && el.vaccination_status === "fully_vaccinated");
            dataset_cases_weekly = dataset_cases_weekly.map(el => ({
                date: el.datum,
                entries: el.entries,
                pop: el.pop
            }));

            dataset_efficacy_cases = build_efficacy(case_efficacy_pie_chart, dataset_vacc_cases_weekly, dataset_cases_weekly, case_efficacy_ui, 0);
        })
        .catch(err => { console.log(err) });
    fetch(path_lookup(api_out, HOSP_WEEKLY_PATH))
        .then(res => res.json())
        .then(out => {
            set_status_value("hosp_weekly_request");
            dataset_hosps_weekly = out.filter(el => el.geoRegion === "CHFL" && el.vaccine === "all" && el.vaccination_status === "fully_vaccinated");
            dataset_hosps_weekly = dataset_hosps_weekly.map(el => ({
                date: el.datum,
                entries: el.entries,
                pop: el.pop
            }));

            dataset_efficacy_hosps = build_efficacy(hosp_efficacy_pie_chart, dataset_vacc_hosps_weekly, dataset_hosps_weekly, hosp_efficacy_ui, 1);
        })
        .catch(err => { console.log(err) });
    fetch(path_lookup(api_out, DEATH_WEEKLY_PATH))
        .then(res => res.json())
        .then(out => {
            set_status_value("death_weekly_request");
            dataset_deaths_weekly = out.filter(el => el.geoRegion === "CHFL" && el.vaccine === "all" && el.vaccination_status === "fully_vaccinated");
            dataset_deaths_weekly = dataset_deaths_weekly.map(el => ({
                date: el.datum,
                entries: el.entries,
                pop: el.pop
            }));
            dataset_efficacy_deaths = build_efficacy(death_efficacy_pie_chart, dataset_vacc_deaths_weekly, dataset_deaths_weekly, death_efficacy_ui, 2);
        })
        .catch(err => { console.log(err) });

    fetch(path_lookup(api_out, CASE_VACC_SEX_PATH))
        .then(res => res.json())
        .then(out => {
            set_status_value("case_vacc_sex_request");
            dataset_vacc_cases_weekly = out.filter(el => el.sex === "all" && el.vaccine === "all" && el.vaccination_status === "fully_vaccinated");
            dataset_vacc_cases_weekly = dataset_vacc_cases_weekly.map(el => ({
                date: el.date,
                entries: el.entries
            }));

            dataset_efficacy_cases = build_efficacy(case_efficacy_pie_chart, dataset_vacc_cases_weekly, dataset_cases_weekly, case_efficacy_ui, 0);
        })
        .catch(err => { console.log(err) });
    fetch(path_lookup(api_out, HOSP_VACC_SEX_PATH))
        .then(res => res.json())
        .then(out => {
            set_status_value("hosp_vacc_sex_request");
            dataset_vacc_hosps_weekly = out.filter(el => el.sex === "all" && el.vaccine === "all" && el.vaccination_status === "fully_vaccinated");
            dataset_vacc_hosps_weekly = dataset_vacc_hosps_weekly.map(el => ({
                date: el.date,
                entries: el.entries
            }));

            dataset_efficacy_hosps = build_efficacy(hosp_efficacy_pie_chart, dataset_vacc_hosps_weekly, dataset_hosps_weekly, hosp_efficacy_ui, 1);
        })
        .catch(err => { console.log(err) });
    fetch(path_lookup(api_out, DEATH_VACC_SEX_PATH))
        .then(res => res.json())
        .then(out => {
            set_status_value("death_vacc_sex_request");
            dataset_vacc_deaths_weekly = out.filter(el => el.sex === "all");
            dataset_vacc_deaths_weekly = dataset_vacc_deaths_weekly.map(el => ({
                date: el.date,
                entries: el.entries
            }));

            dataset_efficacy_deaths = build_efficacy(death_efficacy_pie_chart, dataset_vacc_deaths_weekly, dataset_deaths_weekly, death_efficacy_ui, 2);
        })
        .catch(err => { console.log(err) });



    document.getElementById("min-input").addEventListener("input", (e) => {
        min_input_ui.value = Math.min(min_input_ui.value, max_input_ui.value);
        let value = (min_input_ui.value / parseInt(min_input_ui.max)) * 100;
        range_ui.style.left = value + '%';
        thumb_left_ui.style.left = value + '%';
        min_value_ui.innerHTML = dates.ch[min_input_ui.value];
    });

    document.getElementById("max-input").addEventListener("input", (e) => {
        max_input_ui.value = Math.max(max_input_ui.value, min_input_ui.value);
        let value = (max_input_ui.value / parseInt(max_input_ui.max)) * 100;
        range_ui.style.right = (100 - value) + '%';
        thubb_right_ui.style.left = value + '%';
        max_value_ui.innerHTML = dates.ch[max_input_ui.value];
    });

    document.getElementById("min-input").addEventListener("change", (e) => {
        update_range();
    });
    document.getElementById("max-input").addEventListener("change", (e) => {
        update_range();
    });

    [...document.getElementsByClassName("collapse-toggle")].forEach(el => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            let target = document.querySelector(e.target.dataset.target);
            if (target.classList.contains("open")) {
                target.classList.remove("open");
                e.target.innerText = "show";
            } else {
                target.classList.add("open");
                e.target.innerText = "hide";
            }
            return false;
        });
    });
}




build_status_box();

case_efficacy_pie_chart = build_efficacy_chart(case_efficacy_pie_ctx);
hosp_efficacy_pie_chart = build_efficacy_chart(hosp_efficacy_pie_ctx);
death_efficacy_pie_chart = build_efficacy_chart(death_efficacy_pie_ctx);

build_timeline_chart();


fetch(API_URL)
    .then(res => res.json())
    .then(api_out => {
        set_status_value("api_request");

        let date_source_ui = document.getElementById('date-source');
        date_source_ui.innerText = convert_to_ch(api_out.sourceDate);

        fetch(path_lookup(api_out, VACC_PERSONS_PATH))
            .then(res => res.json())
            .then(out => {
                set_status_value("vacc_persons_request");
                dataset_vacc_persons = out.filter(el => el.geoRegion === "all" && el.indication === "all");
            })
            .catch(err => { console.log(err) });


        fetch(path_lookup(api_out, CASE_VACC_PATH))
            .then(res => res.json())
            .then(out => {
                set_status_value("case_vacc_request");
                dataset_vacc_cases = out.filter(el => START_DATE_PARSED <= Date.parse(el.date) && el.geoRegion === "CHFL");
                dataset_vacc_cases = dataset_vacc_cases.map(el => ({
                    date: convert_to_ch(el.date),
                    parse_date: Date.parse(el.date),
                    entries: el.entries
                }));
                generate_dates(out, api_out);

                cases_chart = build_chart(vacc_cases_ctx, out, 'Fully Vaccinated');

                build_absolute(dataset_vacc_cases, dataset_cases, total_cases_sum_ui, vacc_cases_sum_ui);
            })
            .catch(err => { console.log(err) });

        fetch(path_lookup(api_out, HOSP_VACC_PATH))
            .then(res => res.json())
            .then(out => {
                set_status_value("hosp_vacc_request");
                dataset_vacc_hosps = out.filter(el => START_DATE_PARSED <= Date.parse(el.date) && el.geoRegion === "CHFL");
                dataset_vacc_hosps = dataset_vacc_hosps.map(el => ({
                    date: convert_to_ch(el.date),
                    parse_date: Date.parse(el.date),
                    entries: el.entries
                }));

                generate_dates(out, api_out);
                hosps_chart = build_chart(vacc_hosps_ctx, out, 'Fully Vaccinated');

                build_absolute(dataset_vacc_hosps, dataset_hosps, total_hosps_sum_ui, vacc_hosps_sum_ui);
            })
            .catch(err => { console.log(err) });

        fetch(path_lookup(api_out, DEATH_VACC_PATH))
            .then(res => res.json())
            .then(out => {
                set_status_value("death_vacc_request");
                dataset_vacc_deaths = out.filter(el => START_DATE_PARSED <= Date.parse(el.date) && el.geoRegion === "CHFL");
                dataset_vacc_deaths = dataset_vacc_deaths.map(el => ({
                    date: convert_to_ch(el.date),
                    parse_date: Date.parse(el.date),
                    entries: el.entries
                }));

                generate_dates(out, api_out);

                deaths_chart = build_chart(vacc_deaths_ctx, out, 'Fully Vaccinated');

                build_absolute(dataset_vacc_deaths, dataset_deaths, total_deaths_sum_ui, vacc_deaths_sum_ui);
            })
            .catch(err => { console.log(err) });



        fetch(path_lookup(api_out, CASE_AG_PATH))
            .then(res => res.json())
            .then(out => {
                set_status_value("case_ag_request");
                dataset_vacc_cases_ag = out;
                cases_ag_chart = build_chart_ag(vacc_cases_ag_ctx, out);
            })
            .catch(err => { console.log(err) });
        fetch(path_lookup(api_out, HOSP_AG_PATH))
            .then(res => res.json())
            .then(out => {
                set_status_value("hosp_ag_request");
                dataset_hosps_cases_ag = out;
                hosps_ag_chart = build_chart_ag(vacc_hosps_ag_ctx, out);
            })
            .catch(err => { console.log(err) });
        fetch(path_lookup(api_out, DEATH_AG_PATH))
            .then(res => res.json())
            .then(out => {
                set_status_value("death_ag_request");
                dataset_deaths_cases_ag = out;
                deaths_ag_chart = build_chart_ag(vacc_deaths_ag_ctx, out);
            })
            .catch(err => { console.log(err) });




    })
    .catch(err => { console.log(err) });