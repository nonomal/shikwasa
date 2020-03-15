import PlayerTemplate from './templates/PlayerTemplate'
import IconTemplate from './templates/IconTemplate'
import { secondToTime, numToString,createElement } from './utils'
import applyFocusVisible from './focus-visible'

let resize, duration, cooldown = true

export default class UI {
  constructor(options) {
    this.mounted = false
    if (!document.querySelector('.shk-icons')) {
      this.icons = createElement({
        className: 'shk-icons',
        innerHTML: IconTemplate,
      })
    }
    this.initEl()
    this.initOptions(options)
  }

  initEl() {
    this.el = createElement({
      className: 'shk',
      innerHTML: PlayerTemplate,
    })
    this.playBtn = this.el.querySelector('.shk-btn_toggle')
    this.fwdBtn = this.el.querySelector('.shk-btn_forward')
    this.bwdBtn = this.el.querySelector('.shk-btn_backward')
    this.speedBtn = this.el.querySelector('.shk-btn_speed')
    this.moreBtn = this.el.querySelector('.shk-btn_more')
    this.muteBtn = this.el.querySelector('.shk-btn_volume')
    this.extraControls = this.el.querySelector('.shk-controls_extra')
    this.texts = this.el.querySelector('.shk-text')
    this.artist = this.el.querySelector('.shk-artist')
    this.artistWrap = this.el.querySelector('.shk-artist_wrap')
    this.titleWrap = this.el.querySelector('.shk-title_wrap')
    this.titleInner = this.el.querySelector('.shk-title_inner')
    this.title = this.el.querySelector('.shk-title:not([aria-hidden])')
    this.titleHidden = this.el.querySelector('.shk-title[aria-hidden]')
    this.currentTime = this.el.querySelector('.shk-time_now')
    this.duration = this.el.querySelector('.shk-time_duration')
    this.bar = this.el.querySelector('.shk-bar')
    this.barWrap = this.el.querySelector('.shk-bar_wrap')
    this.audioPlayed = this.el.querySelector('.shk-bar_played')
    this.audioLoaded = this.el.querySelector('.shk-bar_loaded')
    this.handle = this.el.querySelector('.shk-bar-handle')
    this.cover = this.el.querySelector('.shk-cover')
  }

  initOptions(options) {
    // dark mode
    this.el.style = `--color-primary: ${options.themeColor}; --color-handle-shadow: ${options.themeColor}cc`
    if (options.theme === 'auto') {
      this.el.classList.add('Theme-auto')
    } else if (options.theme === 'dark') {
      this.el.classList.add('Theme-dark')
    }
    // download
    if (options.download && options.audio && options.audio.src) {
      this.downloadBtn = createElement({
        tag: 'button',
        className: ['shk-btn', 'shk-btn_download'],
        attrs: {
          title: 'download',
          'aria-label': 'download',
          href: 'options.audio.src',
        },
        innerHTML: /* html */`
          <svg aria-hidden="true">
            <use xlink:href="#shk-icon_download" />
          </svg>
        `,
      })
      this.extraControls.append(this.downloadBtn)
    }
    // player position
    if (options.fixed.type !== 'static') {
      options.fixed.type === 'fixed' ? this.el.classList.add('Fixed') : this.el.classList.add('Auto')
      if (options.fixed.position === 'top') {
        this.el.classList.add('Top')
      }
    }
    // play status display
    options.autoPlay ? this.el.classList.add('Play') : this.el.classList.add('Pause')
    // mute status display
    if (options.muted) {
      this.el.classList.add('Mute')
    }
    //audio info display
    if (options.audio) {
      this.setAudioInfo(options.audio)
    }
  }


  initEvents() {
    this.moreBtn.addEventListener('click', () => {
      this.el.classList.toggle('Extra')
    })
    applyFocusVisible(this.el)
    resize = () => {
      if (!cooldown) return
      cooldown = false
      setTimeout(() => cooldown = true, 100)
      this.marquee.bind(this)()
    }
    window.addEventListener('resize', resize)
  }

  setAudioInfo(audio) {
    this.cover.style.backgroundImage = `url(${audio.cover})`
    this.title.innerHTML = audio.title
    this.titleHidden.innerHTML = audio.title
    if (this.mounted) {
      this.marquee()
    }
    this.artist.innerHTML = audio.artist
    this.currentTime.innerHTML = '00:00'
    this.duration.innerHTML = audio.duration ? secondToTime(audio.duration) : '00:00'
    if (this.downloadBtn) {
      this.downloadBtn.href= audio.src
    }
  }

  setPlaying() {
    this.el.classList.add('Play')
    this.el.classList.remove('Pause')
  }

  setPaused() {
    this.el.classList.add('Pause')
    this.el.classList.remove('Play')
    this.el.classList.remove('Loading')
  }

  setTime(type, time) {
    this[type].innerHTML = secondToTime(time)
  }

  setBar(type, percentage) {
    const typeName = 'audio' + type.charAt(0).toUpperCase() + type.substr(1)
    percentage = Math.min(percentage, 1)
    percentage = Math.max(percentage, 0)
    this[typeName].style.width = percentage * 100 + '%'
    const ariaNow = percentage.toFixed(2)
    this[typeName].setAttribute('aria-value-now', ariaNow)
    this.handle.setAttribute('aria-value-now', ariaNow)
  }

  setProgress(time = 0, percentage = 0, duration = 0) {
    if (time && !percentage) {
      percentage = duration ? time / duration : 0
    } else {
      time = percentage * duration
    }
    this.setTime('currentTime', time)
    this.setBar('played', percentage)
  }

  setSpeed(speed) {
    this.speedBtn.innerHTML = numToString(speed) + 'x'
  }

  getPercentByPos(e) {
    const handlePos = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || 0
    const initPos = this.barWrap.getBoundingClientRect().left
    const barLength = this.barWrap.clientWidth
    let percentage = (handlePos - initPos) / barLength
    percentage = Math.min(percentage, 1)
    percentage = Math.max(0, percentage)
    return percentage
  }

  marquee() {
    const overflow = this.title.offsetWidth - this.texts.offsetWidth
    if (overflow > 0) {
      this.titleWrap.classList.add('Overflow')
      duration = duration || 8000 / (100 + overflow)
      this.title.style.animationDuration = `${duration}s`
      this.titleHidden.style.animationDuration = `${duration}s`
    } else {
      this.titleWrap.classList.remove('Overflow')
    }
  }

  mount(container, components) {
    container.innerHTML = ''
    container.append(this.el)
    if (components && components.length) {
      components.forEach(comp => {
        this.el.append(comp)
      })
    }
    if (this.icons) {
      container.append(this.icons)
    }
    this.mounted = true
    this.initEvents()
    this.marquee()
  }

  destroy() {
    window.removeEventListener('resize', resize)
  }
}