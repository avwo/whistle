require('./base-css.js');
require('../css/timeline.css');
var React = require('react');
var util = require('./util');
var TOTAL_RATE = 80;

var Timeline = React.createClass({
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function() {
    var modal = this.props.modal;
    var data = this.props.data;
    var list = data ? [data] : (modal ? modal.getSelectedList() : []);
    var maxTotal = 1;
    var startTime;

    list.forEach(function(item) {
      if (!startTime || item.startTime < startTime) {
        startTime = item.startTime;
      }
    });

    list.forEach(function(item) {
      var total = (item.endTime || item.responseTime || item.requestTime || item.dnsTime) - startTime;
      if (total > maxTotal) {
        maxTotal = total;
      }
    });

    var len = list.length;
    return (
        <div className={'fill orient-vertical-box w-detail-content w-detail-timeline' + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
          <ul>
            {list.map(function(item) {
              var stalled = item.startTime - startTime;
              var stalledRate, dns, dnsRate, request, requestRate, response, responseRate, load, loadRate;
              if (item.dnsTime) {
                stalled = item.startTime - startTime;
                stalledRate = stalled * TOTAL_RATE / maxTotal + '%';
                stalled += 'ms';
              } else {
                stalled = '-';
                stalledRate = 0;
              }

              if (item.dnsTime) {
                dns = item.dnsTime - item.startTime;
                dnsRate = dns * TOTAL_RATE / maxTotal + '%';
                dns += 'ms';
              } else {
                dns = '-';
                dnsRate = 0;
              }

              if (item.requestTime) {
                request = item.requestTime - item.dnsTime;
                requestRate = request * TOTAL_RATE / maxTotal + '%';
                request += 'ms';
                var protocol = item.protocol;
                if (typeof protocol === 'string' && protocol.indexOf('>') !== -1) {
                  var diffTime =  item.httpsTime - item.startTime;
                  if (diffTime > 0) {
                    request += ' - ' + diffTime + 'ms(' + protocol + ') = ' + (item.requestTime - item.httpsTime) + 'ms';
                  }
                }
              } else {
                request = '-';
                requestRate = 0;
              }

              if (item.responseTime) {
                response = item.responseTime - item.requestTime;
                responseRate = response * TOTAL_RATE / maxTotal + '%';
                response += 'ms';
              } else {
                response = '-';
                responseRate = 0;
              }

              if (item.endTime) {
                load = item.endTime - item.responseTime;
                loadRate = load * TOTAL_RATE / maxTotal + '%';
                load += 'ms';
              } else {
                load = '-';
                loadRate = 0;
              }

              var total = item.endTime ? item.endTime - item.startTime + 'ms' : '-';

              if (len === 1) {
                return (
                  <li key="w-detail-timeline-one" className="w-detail-timeline-one">
                    <ul>
                      <li><span className="w-detail-timeline-url">URL:</span><span className="w-detail-timeline-full-url" title={item.url}>{item.url}</span></li>
                      <li><span className="w-detail-timeline-url">DNS Lookup:</span><span style={{width: dnsRate}} className="w-detail-timeline-dns"></span><span title={title} className="w-detail-timeline-time">{dns}</span></li>
                      <li><span className="w-detail-timeline-url">Request Sent:</span><span style={{width: dnsRate}}></span><span style={{width: requestRate}} className="w-detail-timeline-request"> </span><span title={title} className="w-detail-timeline-time">{request}</span></li>
                      <li><span className="w-detail-timeline-url">Response:</span><span style={{width: dnsRate}}></span><span style={{width: requestRate}}></span><span style={{width: responseRate}} className="w-detail-timeline-response"></span><span title={title} className="w-detail-timeline-time">{response}</span></li>
                      <li><span className="w-detail-timeline-url">Content Load:</span><span style={{width: dnsRate}}></span><span style={{width: requestRate}}></span><span style={{width: responseRate}}></span><span style={{width: loadRate}} className="w-detail-timeline-load"></span><span title={title} className="w-detail-timeline-time">{load}</span></li>
                      <li><span className="w-detail-timeline-url">Total:</span><span title={title} className="w-detail-timeline-time">{total}</span></li>
                    </ul>
                  </li>
                );
              }
              var title = 'URL: ' + item.url + '\nStalled: ' + stalled + '\nDNS Lookup: ' + dns + '\nRequest Sent: ' +
              request + '\nResponse: ' + response + '\nContent Load: ' + load + '\nTotal: ' + total;

              return (
                  <li key={item.id} title={title} className="w-detail-timeline-multi">
                    <span title={item.url} className="w-detail-timeline-url">{util.getFilename(item)}</span>
                    <span style={{width: stalledRate}} className="w-detail-timeline-stalled"></span>
                    <span style={{width: dnsRate}} className="w-detail-timeline-dns"></span>
                    <span style={{width: requestRate}} className="w-detail-timeline-request"></span>
                    <span style={{width: responseRate}} className="w-detail-timeline-response"></span>
                    <span style={{width: loadRate}} className="w-detail-timeline-load"></span>
                    <span title={title} className="w-detail-timeline-time">{total}</span>
                  </li>
              );
            })}
          </ul>
        </div>
    );
  }
});

module.exports = Timeline;
