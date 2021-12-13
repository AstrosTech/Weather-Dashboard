let currentWeather = $(".current-weather")
let weeklyWeather = $(".weekly-weather")
let searchedLocation = $("#searched-location")
let SearchBar = $("#search-bar")

$(this).on('submit', async (event) => {
    event.preventDefault()
    let SearchedLocation = SearchBar.val()
    if(!SearchedLocation) return

    let Coordinates = await getCoordinatesByLocation(SearchedLocation)
    if(!Coordinates) return

    let WeatherData = await getWeather(Coordinates)

    storeSearch(SearchedLocation)
    addAutoComplete()
    displayHourlyWeather(Coordinates.Locality, WeatherData.Response.hourly)
    displayWeeklyWeather(WeatherData.Response.daily)
})

userLocationWeather()
addAutoComplete()

function storeSearch(Searched) {
    let previousSearches = JSON.parse(localStorage.getItem("previousSearches"))
    if(!previousSearches) {
        localStorage.setItem("previousSearches", JSON.stringify([Searched]))
        return
    }
    if(previousSearches.includes(Searched)) return;

    previousSearches.push(Searched)
    localStorage.setItem("previousSearches", JSON.stringify(previousSearches))
    addAutoComplete()
}

function addAutoComplete() {
    let previousSearches = JSON.parse(localStorage.getItem("previousSearches"))
    if(!previousSearches) return;

    SearchBar.autocomplete({
        minLength: 0,
        source: previousSearches,
    }).on('focus', () => { $(this).keydown(); });
}

async function getCoordinatesByLocation(Location) {
    let Response = await $.ajax({
        type: 'GET',
        crossDomain: true,
        url: `https://cors-anywhere.herokuapp.com/http://api.positionstack.com/v1/forward?access_key=c82ebe69d90778128f6ae66f42dff457&query=${Location}&limit=1`
    })

    if(Response.data.length == 0) return
    return { latitude: Response.data[0].latitude, longitude: Response.data[0].longitude, Locality: `${Response.data[0].locality}, ${Response.data[0].region_code}` }
}

async function getCoordinatesByIP(IP) {
    let Response = await $.ajax({
        type: 'GET',
        crossDomain: true,
        url: `https://cors-anywhere.herokuapp.com/http://api.positionstack.com/v1/reverse?access_key=c82ebe69d90778128f6ae66f42dff457&query=${IP}&limit=1`
    })

    if(Response.data.length == 0) return
    return { latitude: Response.data[0].latitude, longitude: Response.data[0].longitude, Locality: `${Response.data[0].locality}, ${Response.data[0].region_code}` }
}

async function getWeather(Coordinates) {
    let Response = await $.ajax({
        type: 'GET',
        url: `https://api.openweathermap.org/data/2.5/onecall?lat=${Coordinates.latitude}&lon=${Coordinates.longitude}&exclude=minutely&units=imperial&appid=04701dea3249dc3b3b18e594ee2df506`
    })

    return { Response }
}

async function userLocationWeather() {
    let userIP = await getUserIP()
    let Coordinates = await getCoordinatesByIP(userIP)
    let WeatherData = await getWeather(Coordinates)

    displayHourlyWeather(Coordinates.Locality, WeatherData.Response.hourly)
    displayWeeklyWeather(WeatherData.Response.daily)
}

async function displayHourlyWeather(locality, WeatherData) {
    currentWeather.empty()
    WeatherData = WeatherData.filter(data => (moment.unix(data.dt).isSame(Date.now(), 'day')))

    searchedLocation.text(`${locality} (${moment().format("dddd, MMMM Do")})`)
    searchedLocation.css('display', "block")

    for(Weather of WeatherData) {
        let cardDiv = $("<div>")
        cardDiv.addClass("hour-card card")

        let cardBody = $("<div>")
        cardBody.addClass("card-body")

        let weatherImage = $("<img>")
        weatherImage.attr("src", `https://openweathermap.org/img/wn/${Weather.weather[0].icon}@2x.png`)
        weatherImage.addClass("weather-icon")
        cardBody.append(weatherImage)

        let cardTitle = $("<div>")
        cardTitle.addClass("card-title")

        let titleParagraph = $("<p>")
        titleParagraph.text(moment.unix(Weather.dt).format("h A"))
        cardTitle.append(titleParagraph)

        let tempDiv = $("<div>")
        tempDiv.addClass("temp")
        tempDiv.text(Weather.temp)

        let supEl = $("<sup> &deg </sup>")
        tempDiv.append(supEl)

        let hourInfo = $("<div>")
        hourInfo.addClass("row justify-content-between")

        // wind speed
        let windDiv = $("<div>")
        windDiv.addClass("col-6")

        let windTitle = $("<div>")
        windTitle.addClass("header")
        windTitle.text("Wind Speed")
        windDiv.append(windTitle)

        let windValue = $("<div>")
        windValue.addClass("value")
        windValue.text(Weather.wind_speed)
        windDiv.append(windValue)
        hourInfo.append(windDiv)

        // humidity
        let humidityDiv = $("<div>")
        humidityDiv.addClass("col-6")

        let humidityTitle = $("<div>")
        humidityTitle.addClass("header")
        humidityTitle.text("Humidity")
        humidityDiv.append(humidityTitle)

        let humidityValue = $("<div>")
        humidityValue.addClass("value")
        humidityValue.text(Weather.humidity + "%")
        humidityDiv.append(humidityValue)
        hourInfo.append(humidityDiv)
        
        // UV index
        let uvIndexWrapper = $("<div>")
        uvIndexWrapper.addClass("row justify-content-between")

        let uvIndexDiv = $("<div>")
        uvIndexDiv.addClass("col-12")

        let uvIndexTitle = $("<div>")
        uvIndexTitle.addClass("header")
        uvIndexTitle.text("UV Index")
        uvIndexDiv.append(uvIndexTitle)

        let uvIndexValue = $("<div>")
        uvIndexValue.addClass("value uv-index")
        
        uvIndexValue.text(Weather.uvi)
        uvIndexValue.css("color", determineUVColor(Weather.uvi))
        uvIndexDiv.append(uvIndexValue)

        uvIndexWrapper.append(uvIndexDiv)
        // Appending To the Card Body
        cardBody.append(cardTitle)
        cardBody.append(tempDiv)
        cardBody.append(hourInfo)
        cardBody.append(uvIndexWrapper)
        // Appending Card to Current Weather Element
        cardDiv.append(cardBody)
        currentWeather.append(cardDiv)
    }
}

async function displayWeeklyWeather(WeatherData) {
    weeklyWeather.empty()
    WeatherData = WeatherData.filter(data => (!moment.unix(data.dt).isSame(Date.now(), 'day')))

    for(Weather of WeatherData) {
        let cardDiv = $("<div>")
        cardDiv.addClass("hour-card card col-md-12 col-lg-5")

        let cardBody = $("<div>")
        cardBody.addClass("card-body w-100")

        let weatherImage = $("<img>")
        weatherImage.attr("src", `https://openweathermap.org/img/wn/${Weather.weather[0].icon}@2x.png`)
        weatherImage.addClass("weather-icon")
        cardBody.append(weatherImage)

        let cardTitle = $("<div>")
        cardTitle.addClass("card-title")

        let titleParagraph = $("<p>")
        titleParagraph.text(moment.unix(Weather.dt).format("dddd, MMMM Do"))
        cardTitle.append(titleParagraph)

        let tempDiv = $("<div>")
        tempDiv.addClass("temp")
        tempDiv.text(Weather.temp.day)

        let supEl = $("<sup> &deg </sup>")
        tempDiv.append(supEl)

        let hourInfo = $("<div>")
        hourInfo.addClass("row justify-content-between")

        // wind speed
        let windDiv = $("<div>")
        windDiv.addClass("col-6")

        let windTitle = $("<div>")
        windTitle.addClass("header")
        windTitle.text("Wind Speed")
        windDiv.append(windTitle)

        let windValue = $("<div>")
        windValue.addClass("value")
        windValue.text(Weather.wind_speed)
        windDiv.append(windValue)
        hourInfo.append(windDiv)

        // humidity
        let humidityDiv = $("<div>")
        humidityDiv.addClass("col-6")

        let humidityTitle = $("<div>")
        humidityTitle.addClass("header")
        humidityTitle.text("Humidity")
        humidityDiv.append(humidityTitle)

        let humidityValue = $("<div>")
        humidityValue.addClass("value")
        humidityValue.text(Weather.humidity + "%")
        humidityDiv.append(humidityValue)
        hourInfo.append(humidityDiv)
        
        // UV index
        let uvIndexWrapper = $("<div>")
        uvIndexWrapper.addClass("row justify-content-between")

        let uvIndexDiv = $("<div>")
        uvIndexDiv.addClass("col-12")

        let uvIndexTitle = $("<div>")
        uvIndexTitle.addClass("header")
        uvIndexTitle.text("UV Index")
        uvIndexDiv.append(uvIndexTitle)

        let uvIndexValue = $("<div>")
        uvIndexValue.addClass("value")
        uvIndexValue.text(Weather.uvi)
        uvIndexValue.css("color", determineUVColor(Weather.uvi))
        uvIndexDiv.append(uvIndexValue)

        uvIndexWrapper.append(uvIndexDiv)
        // Appending To the Card Body
        cardBody.append(cardTitle)
        cardBody.append(tempDiv)
        cardBody.append(hourInfo)
        cardBody.append(uvIndexWrapper)
        // Appending Card to Current Weather Element
        cardDiv.append(cardBody)
        weeklyWeather.append(cardDiv)
    }
}

function determineUVColor(uvi) {
    let color;
    (uvi < 3) ? color = "green" : (uvi > 5) ? color = "red" : color = "orange"
    return color
}

async function getUserIP() {
    let Response = await $.getJSON("https://api.ipify.org/?format=json")
    return Response.ip
}
