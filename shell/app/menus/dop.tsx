// Copyright (c) 2021 Terminus, Inc.
//
// This program is free software: you can use, redistribute, and/or modify
// it under the terms of the GNU Affero General Public License, version 3
// or later ("AGPL"), as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import i18n from 'i18n';
import { filterMenu, MENU_SCOPE } from './util';
import { goTo } from 'common/utils';
import { filter } from 'lodash';
import permStore from 'user/stores/permission';
import ErdaIcon from 'common/components/erda-icon';
import React from 'react';

export const getDopMenu = () => {
  const orgPerm = permStore.getState((s) => s.org);
  return filterMenu(
    filter(
      [
        {
          key: 'projects',
          href: goTo.resolve.dopRoot(), // '/dop/projects',
          icon: <ErdaIcon type="xiangmuguanli" />,
          text: i18n.t('dop:Projects'),
          subtitle: i18n.t('Project'),
        },
        {
          icon: <ErdaIcon type="apisheji" />,
          key: 'apiManage',
          text: i18n.t('API Management'),
          subtitle: 'API',
          href: goTo.resolve.apiManageMarket(),
          show: orgPerm.dop.apiManage.read.pass,
          subMenu: [
            {
              href: goTo.resolve.apiManageRoot(),
              // icon: 'apijs',
              text: i18n.t('default:API Market'),
              prefix: `${goTo.resolve.apiManageMarket()}/`,
            },
            {
              href: goTo.resolve.apiAccessManage(),
              // icon: 'bianliang',
              text: i18n.t('Access Management'),
            },
            {
              href: goTo.resolve.apiMyVisit(),
              // icon: 'renyuan',
              text: i18n.t('My Access'),
            },
          ],
        },
        {
          key: 'approval',
          href: goTo.resolve.dopApprove(), // '/dop/approval/my-approve',
          icon: <ErdaIcon type="shenpi" />,
          text: i18n.t('dop:Approval Request'),
          subtitle: i18n.t('Approve'),
          subMenu: [
            {
              title: i18n.t('dop:Approved by Me'),
              text: i18n.t('dop:Approved by Me'),
              href: goTo.resolve.dopApprovePending(), // '/dop/approval/my-approve/pending',
              prefix: `${goTo.resolve.dopApprove()}/`,
            },
            {
              title: i18n.t('dop:Initiated by Me'),
              text: i18n.t('dop:Initiated by Me'),
              href: goTo.resolve.dopMyInitiateWait(), // '/dop/approval/my-initiate/WaitApprove',
              prefix: `${goTo.resolve.dopMyInitiate()}/`,
            },
          ],
        },
        {
          key: 'dopPublisher',
          href: goTo.resolve.dopPublisher(), // '/dop/publisher',
          icon: <ErdaIcon type="shenpi-3n9l57j5" />,
          text: i18n.t('publisher:My Release'),
          subtitle: i18n.t('Release'),
          show: orgPerm.dop.publisher.read.pass,
        },
      ],
      (item) => item.show !== false,
    ),
    MENU_SCOPE.dop,
  );
};
