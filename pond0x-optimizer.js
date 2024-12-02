(async function r () {
    /***********************************
     * Pond0x optimizer v1.0
     * How to Use:
     * 
     * 1. Modify script settings at the end of this file
     * 2. Change phantom wallet lock time to 8 hours
     * 3. Go to https://www.pond0x.com
     * 4. Wait until website is fully loaded
     * 5. Press your F12 keyboard key to show dev tools
     * 6. Copy and paste this javascript code in your in browser console
     * 7. When Phantom dialog appear, confirm signing
     * 8. Close dev tools by press your F12 keyboard key again
     * 9. Enjoy your fully automatic miner rig ;-)
     * 
     * All informations about Pond0x:
     * - X: @Pond0x | Founders: @Pauly0x & @hwonderWorld
     * Websites:
     * - Pond0x   - https://www.pond0x.com
     * - PondCoin - https://www.pondcoin.com
     * - Linktree - https://linktr.ee/pond0x
     * Coins:
     * - $PNDC (Ethereum)  : 0x423f4e6138e475d85cf7ea071ac92097ed631eea
     * - $wPOND (Solana)   : 3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq
     * - $PORK: (Ethereum) : 0xb9f599ce614Feb2e1BBe58F180F370D05b39344E
     */

    // Get current time in unix format
    const getTime = function () {
        return Math.floor(new Date().getTime() / 1000)
    }
    // Get a dom node from his content text
    const searchNodeByContent = function (selector, text) {
        const nodes = document.querySelectorAll(selector)
        for (n=0; n<nodes.length; n++) {
            const node = nodes[n]
            if (node.textContent == text) {
                return node
            }
        }
        return null
    }
    // Extract all mining session params from pond0x lcd widget
    const getLCDParams = function () {
        const params = {}
        const nodeLines = document.querySelectorAll('.lcdbox')
        for (l=0; l<nodeLines.length; l++) {
            const nodeLine = nodeLines[l]
            //console.log('nodeLine', nodeLine)
            const nodeChars = nodeLine.childNodes
            let paramName = ''
            let paramValue = ''
            let nameOk = false
            for (c=0; c<nodeChars.length; c++) {
                const nodeChar = nodeChars[c]
                let content = nodeChar.textContent || ''
                //console.log('content', content)
                content = content.toLowerCase()
                if (!nameOk) {
                    if (content == ':') {
                        nameOk = true
                        continue
                    }
                    if (content && content != ' ') {
                        paramName += content
                    }
                }
                else if (content && content != ' ') {
                    paramValue += content
                }
            }
            if (nameOk) {
                params[paramName] = paramValue
            }
        }
        return params
    }
    // Get signin signature key from phantom wallet 
    const getSignature = async function () {

        const result = await phantom.solana.signMessage(
            new Buffer('Securely connect xMiner to network'),
            'utf8'
        )
        window.pond0xO.signature = result.signature
        window.pond0xO.publicKey = result.publicKey

        const signatureText = new TextDecoder().decode(result.signature)
        const publicKeyText = result.publicKey.toString()

        console.log(`${lh} - signature: ${signatureText}`)
        console.log(`${lh} - publicKey: ${publicKeyText}`)
    }
    // Hijack phantom wallet to avoid confirm dialog ;-)
    const hijackPhantom = function () {
        window.phantom.solana.signMessage = async (t, n="utf8") => {
            return Promise.resolve({
                signature: pond0xO.signature,
                publicKey: pond0xO.publicKey
            })
        }
    }
    // Get time in milliseconds
    const getTimeMS = function (seconds) {
        return seconds * 1000
    }
    // Reload page silently whitout refresh
    // to keep this script injected 
    const reloadMining = function (back) {
        pond0xO.startTime = getTime()
        if (back) {
            window.history.back()
        }
        setTimeout(function () {
                const mineBtn = searchNodeByContent('p','Mine')
                console.log(`${lh} - launching mining page...`)
                mineBtn.click()
            },
            getTimeMS(pond0xO.reloadInterval)
        )
    }
    // Main function running session
    const run = function () {
        const runTime = getTime()

        const mineBtn = searchNodeByContent('button','Mine')
        const stopBtn = searchNodeByContent('button','STOP ANYWAYS')
        const claimBtn = searchNodeByContent('button','STOP & Claim')

        const mineParams = getLCDParams()
        //if (Object.keys(mineParams).length > 0) {
        //    console.log(`${lh} - mineParams`, JSON.stringify(mineParams))
        //}
        const mineTimedOut = runTime > pond0xO.startTime + pond0xO.noClaimMaxTime

        if (mineBtn) {
            console.log(`${lh} - start mining...`)
            mineBtn.click()
        }
        else if (stopBtn) {
            if (mineTimedOut) {
                console.log(`${lh} - noClaimMaxTime triggered.`)
                console.log(`${lh} - stop mining...`)
                stopBtn.click()
                console.log(`${lh} - reloading...`)
                reloadMining(true)
            }
        }
        else if (claimBtn) {
            if (mineParams.hashrate == '0.00h/s') {
                console.log(`${lh} - claiming ${mineParams.unclaimed} tokens...`)
                claimBtn.click()
                console.log(`${lh} - waiting ${pond0xO.claimInterval} secs...`)
                setTimeout(function () {
                        console.log(`${lh} - reloading...`)
                        reloadMining(true)
                    },
                    getTimeMS(pond0xO.claimInterval)
                )
            }
        }
        else if (mineTimedOut) {
            if (mineParams.unclaimed == '1.6m') {
                console.log(`${lh} - unclaimed stuck at 1.6m.`)
                console.log(`${lh} - noClaimMaxTime triggered.`)
                console.log(`${lh} - reloading...`)
                reloadMining(true)
            }
        }
    }
    const lh = `[pond0x-optimizer]`

    // Pond0x optimizer settings
    // Modify for best performance
    window.pond0xO = {
        startTime: 0,
        // Delay in seconds between each run
        runInterval: 5, // each 5 seconds
        // Delay in seconds between each claim
        claimInterval: 1200, // 20 minutes
        // Delay in seconds between each page reloading
        // depends of your device performance 
        reloadInterval: 5, // 5 secondes
        // Time in seconds to force reload 
        // while no claim action appearing
        // (stuck at 1.6m, connection error, miner updated...)
        noClaimMaxTime: 1500 // 25 minutes
    }

    console.log(`${lh} - loading keys...`)
    await getSignature()
    console.log(`${lh} - settings`, JSON.stringify(pond0xO))
    hijackPhantom()
    console.log(`${lh} - phantom hijacked.`)

    reloadMining(false)
  
    setInterval(
        run,
        getTimeMS(pond0xO.runInterval)
    )
})()