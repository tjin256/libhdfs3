/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function ($, dust, exports) {
  "use strict";

  var filters = {
    'fmt_bytes': function (v) {
      var UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'ZB'];
      var prev = 0, i = 0;
      while (Math.floor(v) > 0 && i < UNITS.length) {
        prev = v;
        v /= 1024;
        i += 1;
      }

      if (i > 0 && i < UNITS.length) {
        v = prev;
        i -= 1;
      }
      return Math.round(v * 100) / 100 + ' ' + UNITS[i];
    },

    'fmt_percentage': function (v) {
      return Math.round(v * 100) / 100 + '%';
    },

    'fmt_time': function (v) {
      var s = Math.floor(v / 1000), h = Math.floor(s / 3600);
      s -= h * 3600;
      var m = Math.floor(s / 60);
      s -= m * 60;

      var res = s + " sec";
      if (m !== 0) {
        res = m + " mins, " + res;
      }

      if (h !== 0) {
        res = h + " hrs, " + res;
      }

      return res;
    }
  };
  $.extend(dust.filters, filters);

  /**
   * Load templates from external sources in sequential orders, and
   * compile them. The loading order is important to resolve dependency.
   *
   * The code compile the templates on the client sides, which should be
   * precompiled once we introduce the infrastructure in the building
   * system.
   *
   * templates is an array of tuples in the format of {url, name}.
   */
  function load_templates(dust, templates, success_cb, error_cb) {
    if (templates.length === 0) {
      success_cb();
      return;
    }

    var t = templates.shift();
    $.get(t.url, function (tmpl) {
      var c = dust.compile(tmpl, t.name);
      dust.loadSource(c);
      load_templates(dust, templates, success_cb, error_cb);
    }).error(function (jqxhr, text, err) {
      error_cb(t.url, jqxhr, text, err);
    });
  }

  /**
   * Load a sequence of JSON.
   *
   * beans is an array of tuples in the format of {url, name}.
   */
  function load_json(beans, success_cb, error_cb) {
    var data = {}, error = false, to_be_completed = beans.length;

    $.each(beans, function(idx, b) {
      if (error) {
        return false;
      }
      $.get(b.url, function (resp) {
        data[b.name] = resp;
        to_be_completed -= 1;
        if (to_be_completed === 0) {
          success_cb(data);
        }
      }).error(function (jqxhr, text, err) {
        error = true;
        error_cb(b.url, jqxhr, text, err);
      });
    });
  }

  exports.load_templates = load_templates;
  exports.load_json = load_json;

}($, dust, window));