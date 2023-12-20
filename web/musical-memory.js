class EventBus {
    constructor() {
        this.handlers = {}
    }

    on(eventType, handler) {
        if (! this.handlers.hasOwnProperty(eventType)) {
            this.handlers[eventType] = []
        }
        this.handlers[eventType].push(handler)
    }

    publish(eventType, event) {
        if (this.handlers.hasOwnProperty(eventType)) {
            this.handlers[eventType].forEach(handler => handler(event))
        }
    }
}

const eventBus = new EventBus()
eventBus.on('log', (event) => console.log(event))

const audio0Elem = document.getElementById('audio0')
const audio1Elem = document.getElementById('audio1')

const modal = document.getElementById('myModal')
const modalImgElem = document.getElementById('modalImg')

class AudioTune {
    constructor(tune, side, img, audio, duration) {
        this.tune = tune
        this.side = side
        this.img = img
        this.audio = audio
        this.duration = duration
    }
}
class AudioTuneElementPair {
    constructor(audioTune, htmlElem) {
        this.audioTune = audioTune
        this.htmlElem = htmlElem
    }
    arePartsOfSameTune(otherPair) {
        return (this.audioTune.tune === otherPair.audioTune.tune) && (this.audioTune.side !== otherPair.audioTune.side)
    }
}

const audioTunes = {}
const flippedAudioTunesAndElems = {}

eventBus.on('show-modal', showModalEvent => {
    // sets the image and displays the modal
    modalImgElem.setAttribute('src', showModalEvent['src'])
    setTimeout(
        () => modal.style.display = 'block',
        1500
    )
    
    // hides the modal aznd performs the on-hide callback after the given duration
    setTimeout(
        () => {
            modal.style.display = 'none'
            modalImgElem.removeAttribute('src')
            showModalEvent['onHide']()
        },
        (showModalEvent['duration'] - 1) * 1000
    )
})

function playFlippedTunes() {
    const audioTuneIdsAndSides = Object.keys(flippedAudioTunesAndElems)
    const audioTuneAndElem0 = flippedAudioTunesAndElems[audioTuneIdsAndSides[0]]
    const audioTuneAndElem1 = flippedAudioTunesAndElems[audioTuneIdsAndSides[1]]
    
    audio0Elem.setAttribute('src', audioTuneAndElem0.audioTune.audio)
    audio0Elem.pause()
    audio0Elem.currentTime = 0
    audio1Elem.setAttribute('src', audioTuneAndElem1.audioTune.audio)
    audio1Elem.pause()
    audio1Elem.currentTime = 0

    // same song: play the tune, make the cards unflippable
    if (audioTuneAndElem0.arePartsOfSameTune(audioTuneAndElem1)) {
        // shows the success modal
        eventBus.publish('show-modal', {
            src: 'dancing-cat.gif',
            duration: audioTuneAndElem0.audioTune.duration,
            onHide: () => {
                // make the cards unflippable
                audioTuneAndElem0.htmlElem.onclick = null
                audioTuneAndElem1.htmlElem.onclick = null
            }
        })
    } else {
        // shows the failure modal
        eventBus.publish('show-modal', {
            src: 'error-cat.gif',
            duration: 7,
            onHide: () => {
                // stops the music and flip the cars back
                audio0Elem.pause()
                audio1Elem.pause()

                audioTuneAndElem0.htmlElem.classList.toggle('hover')
                audioTuneAndElem1.htmlElem.classList.toggle('hover')
            }
        })
    }

    // plays the song
    audio0Elem.play()
    audio1Elem.play()

    // do not flag these flipped cards anymore
    delete flippedAudioTunesAndElems[audioTuneIdsAndSides[0]]
    delete flippedAudioTunesAndElems[audioTuneIdsAndSides[1]]
}

eventBus.on('flip-card', cardClickEvent => {
    const audioTuneIdAndSide = cardClickEvent['audioTuneIdAndSide']

    // don't do anything if the card is already flipped
    if (flippedAudioTunesAndElems.hasOwnProperty(audioTuneIdAndSide)) {
        return
    }

    const audioTune = audioTunes[audioTuneIdAndSide]
    const cardFlipperElem = cardClickEvent['htmlElem']

    switch (Object.keys(flippedAudioTunesAndElems).length) {
        case 0:
        case 1:
            cardFlipperElem.classList.toggle('hover')
            flippedAudioTunesAndElems[audioTuneIdAndSide] = new AudioTuneElementPair(audioTune, cardFlipperElem)
            break
        default:
            console.error(`invalid number of flipped cards: ${flippedAudioTunesAndElems.length}`)
            return
    }

    if (Object.keys(flippedAudioTunesAndElems).length == 2) {
        playFlippedTunes()
    }
})

function cardHtmlString(audioTune) {
    return `
    <div class="flip-container hover" onclick="eventBus.publish('flip-card', {htmlElem: this, audioTuneIdAndSide: '${audioTune.tune}-${audioTune.side}'});">
        <div class="flipper">
            <div class="rounded card front">
                <img src="${audioTune.img}" alt="" />
            </div>
            <div class="rounded card back"></div>
        </div>
    </div>`.trim()
}
function shuffle(items) {
    items.sort(() => Math.random() - 0.5)
}

function createCards(tunes) {
    const leftCards = []
    const rightCards = []

    tunes.forEach(tune => {
        const leftAudioTune = new AudioTune(tune['id'], 'left', tune['img'], tune['left'], tune['duration'])
        audioTunes[`${leftAudioTune.tune}-${leftAudioTune.side}`] = leftAudioTune

        const rightAudioTune = new AudioTune(tune['id'], 'right', tune['img'], tune['right'], tune['duration'])
        audioTunes[`${rightAudioTune.tune}-${rightAudioTune.side}`] = rightAudioTune

        const leftAudioCardHtmlString = cardHtmlString(leftAudioTune)
        const rightAudioCardHtmlString = cardHtmlString(rightAudioTune)
        leftCards.push(leftAudioCardHtmlString)
        rightCards.push(rightAudioCardHtmlString)
    })

    // shuffles the card sets then displays them
    shuffle(leftCards)
    shuffle(leftCards)
    shuffle(rightCards)
    shuffle(rightCards)
    const cardsHolder = document.getElementById('cards')
    leftCards.forEach((leftCardString, cardIndex) => {
        const rowElem = document.createElement('div')
        rowElem.setAttribute('class', 'row')

        const leftCardElem = document.createElement('div')
        leftCardElem.setAttribute('class', 'col-5')
        leftCardElem.innerHTML = leftCardString

        const spacerElem = document.createElement('div')
        spacerElem.setAttribute('class', 'col-2')

        const rightCardElem = document.createElement('div')
        rightCardElem.setAttribute('class', 'col-5')
        rightCardElem.innerHTML = rightCards[cardIndex]

        rowElem.appendChild(leftCardElem)
        rowElem.appendChild(spacerElem)
        rowElem.appendChild(rightCardElem)
        cardsHolder.appendChild(rowElem)
    })
}

fetch('media/tunes.json').then(
    tunesResponse => tunesResponse.json()
).then(
    tunes => {
        eventBus.publish('log', tunes)
        createCards(tunes)
    }
)
