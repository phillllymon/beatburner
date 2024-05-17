export const gameDataConst = {
    songDelay: 4000, // ms
    maxTailLength: 500,
    targetBoundSizes: {
        top: 0.04,
        bottom: 0.03
    },
    mobile: {
        maxTailLength: 1.2,
        travelLength: 1.285, // fraction of viewWidth
        targetBounds: {
            top: 0.96,      // fraction of travelLength
            bottom: 1.03    // fraction of travelLength
        }
    },
    minNoteGap: 150,    // ms between notes on the same slide
    allSlides: [
        "slide-left",
        "slide-a",
        "slide-b",
        "slide-right"
    ]
}

export const songStages = [
    [
        "liveInMyHead", // medium happy 92.2
        "blahBlahBlah",
        "innerPeace", // medium *best 89
        "burningBayou",
        "getThatFeeling" // intense 94.9
    ],
    [    
        "lifeIBelieve", // medium 90.9
        "thinkingOfYou", // medium 87.5
        "rascalBack", // medium country 88.7
        "hypeMeUp", // intense 96.2
        "paleCityGirl", // intense nostalgic 93.9
    ],
    [  
        "indian", // intense 95.4
        "neverBackDown", // medium *best 90.1
        "womanWithTheWind", // medium countryish 93.6
        "wayYouMove",
        "moneyMoney", // intense rap 91.6
    ],
    [ 
        "echoesOfThePast", // medium western 90.4
        "aLifeLikeThis", // medium bouncy 92
        "neverBeBlue", // meduim happy french 89.2
        "schoolGirlCrush", // medium 90.4
        "temptation", // intense countryish 89.7
    ],
    [
        "handle", // intense 88
        "animal", // medium ska 94.7
        "myHeartIsAllYours", // medium happy 96.9 
        "itDoesntMatter", // intense 89.5
        "rockItTonight", // medium oldie 91.9
    ],
    [
        "prettyThing", // mellow happy 87.2
        "hotHotFire", // intense 95.9
        "words", // mellow country 94.2
        "heartBlueBlack", // medium country 94.5
        "intoTheNight", // Brent 90.4
        // "whispersOfTheWreck", // mellow 95
        "inevitable", // medium spanish 82.7
        "echoesOfRebellion", // medium 90.7
        "discoBeat",
        "shareLove"
    ]
];

export const songAuthors = {
    "blahBlahBlah": "Camille de la Cruz",
    "burningBayou": "Assaf Ayalon",
    "discoBeat": `Clarx <a href="https://www.youtube.com/watch?v=_H5UO3c4YtM">NCS</a>`,
    "echoesOfRebellion": "R Harris",
    "getThatFeeling": "Ikoliks",
    "heartBlueBlack": "Assaf Ayalon",
    "hypeMeUp": "IamDayLight, Curtis Cole, Paper Plastic",
    "inevitable": "Donnor & Tie",
    "lifeIBelieve": "Jon Worthy and the Bends",
    "liveInMyHead": "Eldar Kedem",
    "neverBackDown": "Ben Goldstein feat. Moon",
    "neverBeBlue": "Dan Zeitune",
    "paleCityGirl": "Indiana Bradley",
    "prettyThing": "Crosstown Traffic",
    "rascalBack": "Ben Bostick",
    "schoolGirlCrush": "Brunch with Bunny",
    "wayYouMove": "Ben Wagner",
    "shareLove": "Buddha Kid",
    // "shouldBeMe": "Kyle Cox",
    "whispersOfTheWreck": "R Harris",
    "words": "Assaf Ayalon",
    "aLifeLikeThis": "River Lume",
    "echoesOfThePast": "Max Hixon",
    "hotHotFire": "MILANO",
    "moneyMoney": "MILANO",
    "rockItTonight": "MILANO",
    "animal": "Title Holder",
    "handle": "Van Stee",
    "indian": "Taheda",
    "innerPeace": "Yotam Ben Horin",
    "itDoesntMatter": "Title Holder",
    "myHeartIsAllYours": "Steven Beddall",
    "thinkingOfYou": "SOURWAH",
    "temptation": "Ride Free",
    "womanWithTheWind": "Ben Strawn",
    // "cactusFlower": "Southern Call",
    "intoTheNight": "Brent Henderson",
    "myHeart": `Different Heaven & EH!DE <a href="https://www.youtube.com/watch?v=jK2aIUmmdP4">NCS</a>`
}

export const songData = {
    "agressiveMetal": "Aggressive Metal",
    "aHumanBeing": "A Human Being",
    "anthemOfRain": "Anthem of Rain",
    "bigWhiteLimousine": "Big White Limousine",
    "blahBlahBlah": "Blah Blah Blah",
    "burningBayou": "Burning on the Bayou",
    "canvasOfDreams": "Canvas of Dreams",
    "cosmicCaravan": "Cosmic Caravan",
    "cricket": "Cricket",
    "discoBeat": "Disco",
    "disfigure": "Disfigure",
    "doItAgain": "Do It Again",
    "echoesOfRebellion": "Echoes of Rebellion",
    "fightSong": "Israel Fight Song",
    "findAWay": "Find a Way",
    "fuckingTribute": "Mysticism of Your Fucking Sound",
    "getThatFeeling": "Get That Feeling",
    "glowOfTheMoon": "In the Glow of the Moon",
    "godOrDevil": "God or the Devil",
    "happierWithoutYou": "Happier Without You",
    "heartBlueBlack": "My Heart is Blue Black",
    "hypeMeUp": "Hype Me Up",
    "inevitable": "Inevitable",
    "keepYou": "Keep You",
    "lifeIBelieve": "A Life I Believe",
    "littleGirl": "Little Girl",
    "liveInMyHead": "Live In My Head",
    "maniaMaster": "Mania Master",
    "monkeyBusiness": "Monkey Business",
    "myHeart": "My Heart",
    "myLife": "It's My Life",
    "needYourLove": "I Need Your Love",
    "neverBackDown": "Never Back Down",
    "neverBeBlue": "Never Be Blue",
    "onAndOn": "On and On",
    "oneStep": "One Step at a Time",
    "oneSweetDream": "One Sweet Dream",
    "overSpeedLimit": "50 Over the Speed Limit",
    "oweItToYou": "I Owe it to You",
    "paleCityGirl": "Pale City Girl",
    "prettyThing": "Pretty Thing",
    "rascalBack": "The Rascal is Back",
    "romeoAndJuliet": "Romeo and Juliet",
    "satinDress": "Satin Dress",
    "schoolGirlCrush": "School Girl Crush",
    "secretToSell": "Secret to Sell",
    "sexualDeviant": "Pretty Tame Sexual Deviant",
    "shareLove": "Share Love",
    "shouldBeMe": "That Should Be Me",
    "skyHigh": "Sky High",
    "stickAroundYou": "Stick Around You",
    "stopTheWar": "Stop the War",
    "sunnyVibe": "Sunny Vibe",
    "takeMe": "Take Me",
    "timeOfMyLife": "Time of My Life",
    "turnItUp": "Turn It Up",
    "ufo": "UFO",
    "unbreakable": "Unbreakable",
    "wayYouMove": "Way You Move",
    "whispersOfTheWreck": "Whispers of the Wreck",
    "words": "Words",
    "aLifeLikeThis": "A Life Like This",
    "aThousandTimes": "A Thousand Times",
    "echoesOfThePast": "Echoes of the Past",
    "hotHotFire": "Hot Hot Fire",
    "low": "Low",
    "moneyMoney": "Money Money",
    "motherOfLife": "Mother of Life",
    "rockItTonight": "Rock It Tonight",
    "safariSurf": "Safari Surf",
    "saturdaySpecial": "Saturday Special",
    "animal": "Animal",
    "cactusFlower": "Cactus Flower",
    "circusStory": "Russian Circus Story",
    "emptyApartment": "Empty Apartment",
    "handle": "Handle",
    "indian": "Indian",
    "innerPeace": "Inner Peace",
    "itDoesntMatter": "It Doesn't Matter",
    "myHeartIsAllYours": "My Heart is All Yours",
    "nowhere": "Nowhere",
    "rockwell": "Rockwell",
    "springRain": "Spring Rain",
    "thinkingOfYou": "Thinking of You",
    "temptation": "Temptation",
    "womanWithTheWind": "Woman with the Wind",
    "intoTheNight": "Into the Night"
}