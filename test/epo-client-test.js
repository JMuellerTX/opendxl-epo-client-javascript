'use strict'
/* eslint no-unused-expressions: "off" */

const expect = require('chai').expect
const EpoClient = require('..').EpoClient

function createMockDxlClient () {
  const registered = {}
  return {
    registered,
    addEventCallback: function (topic, cb) {
      registered[topic] = registered[topic] || []
      registered[topic].push(cb)
    },
    removeEventCallback: function (topic, cb) {
      const list = registered[topic]
      if (list) {
        const idx = list.indexOf(cb)
        if (idx >= 0) {
          list.splice(idx, 1)
        }
      }
    }
  }
}

describe('EpoClient event callbacks', function () {
  it('scopes callback wrappers per topic and client instance without mutating callback', function () {
    const dxlClient1 = createMockDxlClient()
    const dxlClient2 = createMockDxlClient()
    const epoClient1 = new EpoClient(dxlClient1, 'epo1')
    const epoClient2 = new EpoClient(dxlClient2, 'epo2')

    const sharedCallback = function () {}
    const topic1 = '/mcafee/event/epo/threat/response'
    const topic2 = '/custom/epo/threat/topic'

    epoClient1.addThreatEventCallback(sharedCallback, topic1)
    epoClient1.addThreatEventCallback(sharedCallback, topic2)
    epoClient2.addThreatEventCallback(sharedCallback, topic1)

    expect(sharedCallback._dxlWrapper).to.be.undefined
    expect(dxlClient1.registered[topic1]).to.have.lengthOf(1)
    expect(dxlClient1.registered[topic2]).to.have.lengthOf(1)
    expect(dxlClient2.registered[topic1]).to.have.lengthOf(1)

    epoClient1.removeThreatEventCallback(sharedCallback, topic1)
    expect(dxlClient1.registered[topic1]).to.be.empty
    expect(dxlClient1.registered[topic2]).to.have.lengthOf(1)
    expect(dxlClient2.registered[topic1]).to.have.lengthOf(1)

    epoClient1.removeThreatEventCallback(sharedCallback, topic2)
    expect(dxlClient1.registered[topic2]).to.be.empty

    epoClient2.removeThreatEventCallback(sharedCallback, topic1)
    expect(dxlClient2.registered[topic1]).to.be.empty
  })
})
