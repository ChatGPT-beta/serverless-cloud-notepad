const DEFAULT_LANG = 'en'
const SUPPORTED_LANG = {
    'en': {
        err: 'Error',
        pepw: 'Please enter password.',
        pwcnbe: 'Password is empty!',
        enpw: 'Enter a new password(Keeping it empty will remove the current password)',
        pwss: 'Password set successfully.',
        pwrs: 'Password removed successfully.',
        cpys: 'Copied!',
    },
    'zh': {
        err: '出错了',
        pepw: '请输入密码',
        pwcnbe: '密码不能为空！',
        enpw: '输入新密码（留空可清除当前密码）',
        pwss: '密码设置成功！',
        pwrs: '密码清除成功！',
        cpys: '已复制',
    }
}

const getI18n = key => {
    const userLang = (navigator.language || navigator.userLanguage || DEFAULT_LANG).split('-')[0]
    const targetLang = Object.keys(SUPPORTED_LANG).find(l => l === userLang) || DEFAULT_LANG
    return SUPPORTED_LANG[targetLang][key]
}

const errHandle = (err) => {
    alert(`${getI18n('err')}: ${err}`)
}

const throttle = (func, delay) => {
    let tid = null

    return (...arg) => {
        if (tid) return;

        tid = setTimeout(() => {
            func(...arg)
            tid = null
        }, delay)
    }
}

const passwdPrompt = () => {
    const passwd = window.prompt(getI18n('pepw'))
    if (passwd == null) return;

    if (!passwd.trim()) {
        alert(getI18n('pwcnbe'))
    }
    const path = location.pathname
    window.fetch(`${path}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            passwd,
        }),
    })
        .then(res => res.json())
        .then(res => {
            if (res.err !== 0) {
                return errHandle(res.msg)
            }
            if (res.data.refresh) {
                window.location.reload()
            }
        })
        .catch(err => errHandle(err))
}

const renderPlain = (node, text) => {
    if (node) {
        node.innerHTML = DOMPurify.sanitize(text)
    }
}

const renderMarkdown = (node, text) => {
    if (node) {
        const parseText = marked.parse(text)
        node.innerHTML = DOMPurify.sanitize(parseText)
    }
}

window.addEventListener('DOMContentLoaded', function () {
    const $textarea = document.querySelector('#contents')
    const $loading = document.querySelector('#loading')
    const $pwBtn = document.querySelector('.opt-pw')
    const $modeBtn = document.querySelector('.opt-mode > input')
    const $shareBtn = document.querySelector('.opt-share > input')
    const $langSelect = document.querySelector('.opt-lang')
    const $previewPlain = document.querySelector('#preview-plain')
    const $previewMd = document.querySelector('#preview-md')
    const $shareModal = document.querySelector('.share-modal')
    const $closeBtn = document.querySelector('.share-modal .close-btn')
    const $copyBtn = document.querySelector('.share-modal .opt-button')
    const $shareInput = document.querySelector('.share-modal input')

    // Initialize CodeMirror
    const editor = CodeMirror.fromTextArea($textarea, {
        mode: 'plain',
        theme: 'monokai',
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        extraKeys: {
            "Tab": "indentMore",
            "Shift-Tab": "indentLess"
        }
    });

    // Set editor height
    editor.setSize(null, 'calc(100vh - 120px)');

    // Map dropdown value to CodeMirror mode
    const modeMap = {
        plain: 'null',
        javascript: 'javascript',
        python: 'python',
        java: 'text/x-java',
        cpp: 'text/x-c++src',
        csharp: 'text/x-csharp',
        php: 'application/x-httpd-php',
        ruby: 'ruby',
        go: 'go',
        rust: 'rust',
    };

    // Set initial mode based on dropdown value
    if ($langSelect) {
        const initialMode = modeMap[$langSelect.value] || 'null';
        editor.setOption('mode', initialMode);
        $langSelect.onchange = function() {
            const mode = modeMap[this.value] || 'null';
            editor.setOption('mode', mode);
        }
    }

    renderPlain($previewPlain, editor.getValue())
    renderMarkdown($previewMd, editor.getValue())

    if ($textarea) {
        editor.on('change', throttle(function () {
            renderMarkdown($previewMd, editor.getValue())

            $loading.style.display = 'inline-block'
            const data = {
                t: editor.getValue(),
            }

            window.fetch('', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        errHandle(res.msg)
                    }
                })
                .catch(err => errHandle(err))
                .finally(() => {
                    $loading.style.display = 'none'
                })
        }, 1000))
    }

    if ($pwBtn) {
        $pwBtn.onclick = function () {
            const passwd = window.prompt(getI18n('enpw'))
            if (passwd == null) return;

            const path = window.location.pathname
            window.fetch(`${path}/pw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    passwd: passwd.trim(),
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }
                    alert(passwd ? getI18n('pwss') : getI18n('pwrs'))
                })
                .catch(err => errHandle(err))
        }
    }

    if ($modeBtn) {
        $modeBtn.onclick = function (e) {
            const isMd = e.target.checked
            const path = window.location.pathname
            window.fetch(`${path}/setting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mode: isMd ? 'md' : 'plain',
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }

                    window.location.reload()
                })
                .catch(err => errHandle(err))
        }
    }

    if ($shareBtn) {
        $shareBtn.onclick = function (e) {
            const isShare = e.target.checked
            const path = window.location.pathname
            window.fetch(`${path}/setting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    share: isShare,
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }

                    if (isShare) {
                        const origin = window.location.origin
                        const url = `${origin}/share/${res.data}`
                        // show modal
                        $shareInput.value = url
                        $shareModal.style.display = 'block'
                    }
                })
                .catch(err => errHandle(err))
        }
    }

    if ($shareModal) {
        $closeBtn.onclick = function () {
            $shareModal.style.display = 'none'

        }
        $copyBtn.onclick = function () {
            clipboardCopy($shareInput.value)
            const originText = $copyBtn.innerHTML
            const originColor = $copyBtn.style.background
            $copyBtn.innerHTML = getI18n('cpys')
            $copyBtn.style.background = 'orange'
            window.setTimeout(() => {
                $shareModal.style.display = 'none'
                $copyBtn.innerHTML = originText
                $copyBtn.style.background = originColor
            }, 1500)
        }
    }

})
