require('../css/timeline.css');
var React = require('react');
var util = require('./util');
var TOTAL_RATE = 82;

var Timeline = React.createClass({
  shouldComponentUpdate: util.shouldComponentUpdate,
  render: function () {
    var modal = this.props.modal;
    var data = this.props.data;
    var list = data ? [data] : modal ? modal.getSelectedList() : [];
    var maxTotal = 1;
    var startTime;

    list.forEach(function (item) {
      if (!startTime || item.startTime < startTime) {
        startTime = item.startTime;
      }
    });

    list.forEach(function (item) {
      var total =
        (item.endTime ||
          Math.max(item.responseTime || 0, item.requestTime || 0) ||
          item.dnsTime) - startTime;
      if (total > maxTotal) {
        maxTotal = total;
      }
    });

    var len = list.length;
    return (
      <div
        className={
          'fill v-box w-detail-ctn w-timeline' +
          (util.getBool(this.props.hide) ? ' hide' : '')
        }
      >
        <ul>
          {list.map(function (item) {
            var stalled = item.startTime - startTime;
            var stalledRate,
              ttfb,
              ttfbRate,
              dns,
              dnsRate,
              request,
              requestRate,
              response,
              responseRate,
              load,
              loadRate;
            if (item.dnsTime) {
              stalled = item.startTime - startTime;
              stalledRate = (stalled * TOTAL_RATE) / maxTotal + '%';
              stalled += 'ms';
            } else {
              stalled = '-';
              stalledRate = 0;
            }

            if (item.ttfb >= 0) {
              ttfb = item.ttfb;
              ttfbRate = (ttfb * TOTAL_RATE) / maxTotal + '%';
              ttfb += 'ms';
            } else {
              ttfb = '-';
            }

            if (item.dnsTime) {
              dns = item.dnsTime - item.startTime;
              dnsRate = (dns * TOTAL_RATE) / maxTotal + '%';
              dns += 'ms';
            } else {
              dns = '-';
              dnsRate = 0;
            }

            var isStream;
            if (item.responseTime) {
              isStream =
                !item.requestTime || item.requestTime > item.responseTime;
              response =
                item.responseTime -
                (isStream ? item.dnsTime : item.requestTime);
              responseRate = (response * TOTAL_RATE) / maxTotal + '%';
              response += 'ms';
            } else {
              response = '-';
              responseRate = 0;
            }

            if (item.requestTime) {
              request = item.requestTime - item.dnsTime;
              requestRate = (request * TOTAL_RATE) / maxTotal + '%';
              request += 'ms';
              var protocol = item.protocol;
              if (
                typeof protocol === 'string' &&
                protocol.indexOf('>') !== -1
              ) {
                var diffTime = item.httpsTime - item.startTime;
                if (diffTime > 0) {
                  request +=
                    ' - ' +
                    diffTime +
                    'ms(' +
                    protocol +
                    ') = ' +
                    (item.requestTime - item.httpsTime) +
                    'ms';
                }
              }
            } else {
              request = '-';
              requestRate = 0;
            }

            if (item.endTime) {
              load = item.endTime - item.responseTime;
              loadRate = (load * TOTAL_RATE) / maxTotal + '%';
              load += 'ms';
            } else {
              load = '-';
              loadRate = 0;
            }

            var total = item.endTime
              ? item.endTime - item.startTime + 'ms'
              : '-';

            if (len === 1) {
              return (
                <li
                  key="w-timeline-one"
                  className="w-timeline-one"
                >
                  <ul>
                    <li>
                      <span className="w-timeline-url">URL:</span>
                      <span
                        className="w-timeline-full-url"
                        title={item.url}
                      >
                        {item.url}
                      </span>
                    </li>
                    <li>
                      <span className="w-timeline-url">TTFB:</span>
                      <span
                        style={{ width: ttfbRate }}
                        className="w-timeline-ttfb"
                      />
                      <span title={title} className="w-timeline-time">
                        {ttfb}
                      </span>
                    </li>
                    <li>
                      <span className="w-timeline-url">DNS:</span>
                      <span
                        style={{ width: dnsRate }}
                        className="w-timeline-dns"
                      />
                      <span title={title} className="w-timeline-time">
                        {dns}
                      </span>
                    </li>
                    <li>
                      <span className="w-timeline-url">
                        Request:
                      </span>
                      <span style={{ width: dnsRate }} />
                      <span
                        style={{ width: requestRate }}
                        className="w-timeline-request"
                      >
                        {' '}
                      </span>
                      <span title={title} className="w-timeline-time">
                        {request}
                      </span>
                    </li>
                    <li>
                      <span className="w-timeline-url">
                        Response:
                      </span>
                      <span style={{ width: dnsRate }} />
                      {isStream ? null : (
                        <span style={{ width: requestRate }} />
                      )}
                      <span
                        style={{ width: responseRate }}
                        className="w-timeline-response"
                      />
                      <span title={title} className="w-timeline-time">
                        {response}
                      </span>
                    </li>
                    <li>
                      <span className="w-timeline-url">
                        Download:
                      </span>
                      <span style={{ width: dnsRate }} />
                      {isStream ? null : (
                        <span style={{ width: requestRate }} />
                      )}
                      <span style={{ width: responseRate }} />
                      <span
                        style={{ width: loadRate }}
                        className="w-timeline-load"
                      />
                      <span title={title} className="w-timeline-time">
                        {load}
                      </span>
                    </li>
                    <li>
                      <span className="w-timeline-url">Total Duration:</span>
                      <span title={title} className="w-timeline-time">
                        {total}
                      </span>
                    </li>
                  </ul>
                </li>
              );
            }
            var title =
              'URL: ' +
              item.url +
              '\nStalled: ' +
              stalled +
              '\nTFFB: ' +
              ttfb +
              '\nDNS: ' +
              dns +
              '\nRequest: ' +
              request +
              '\nResponse: ' +
              response +
              '\nContent: ' +
              load +
              '\nTotal: ' +
              total;
            var reqStream = isStream && requestRate;
            var resStream = isStream && responseRate;

            return (
              <li
                key={item.id}
                title={title}
                className={'w-timeline-multi' + (resStream ? ' w-timeline-stream' : '')}
              >
                <span title={item.url} className="w-timeline-url">
                  {util.getFilename(item)}
                </span>
                <span
                  style={{ width: stalledRate }}
                  className="w-timeline-stalled"
                />
                <span
                  style={{ width: dnsRate }}
                  className="w-timeline-dns"
                />
                <span
                  style={{
                    width: requestRate,
                    marginBottom: resStream ? '5px' : undefined
                  }}
                  className="w-timeline-request"
                />
                <span
                  style={{
                    width: responseRate,
                    marginLeft:
                      reqStream ? '-' + requestRate : undefined,
                    marginBottom: reqStream ? '-5px' : undefined,
                    height: reqStream ? '15px' : undefined
                  }}
                  className="w-timeline-response"
                />
                <span
                  style={{
                    width: loadRate,
                    marginLeft:
                      resStream ? '-' + responseRate : undefined,
                    marginBottom: reqStream ? '-5px' : undefined,
                    height: reqStream ? '15px' : undefined
                  }}
                  className="w-timeline-load"
                />
                <span title={title} className="w-timeline-time">
                  {total}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
});

module.exports = Timeline;
