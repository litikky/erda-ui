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

import React from 'react';
import { floor } from 'lodash';
import { Progress, Spin, Tooltip } from 'antd';
import ErdaTable from 'common/components/table';
import { cutStr, fromNow, secondsToTime } from 'common/utils';
import themeColor from 'app/theme-color.mjs';
import i18n from 'i18n';
import './test-list.scss';
import applicationTestStore from 'application/stores/test';
import { useLoading } from 'core/stores/loading';
import TestDetailContainer from './test-detail-container';
import { ColumnProps } from 'antd/lib/table';
import CoverageReport from './coverage-report';

const getTestDuration = (duration: any) => {
  const seconds = floor(parseInt(duration, 10) / 10 ** 9, 3); // 时间为纳秒
  return duration !== 0 && seconds === 0
    ? `${duration / 1000000} ${i18n.t('dop:millisecond(s)')}`
    : secondsToTime(seconds, true);
};

const ExecuteResult = ({ totals }: { totals: { tests: number; statuses: TEST.Statuses } }) => {
  if (!totals) {
    return null;
  }
  const { failed, error, passed, skipped } = totals.statuses;
  const { tests } = totals;
  const passedPercent = tests ? floor(((passed + skipped) * 100) / tests, 2) : 0;
  const title = (
    <div>
      <div>
        {i18n.t('failed')}: {failed}
      </div>
      <div>
        {i18n.t('Error')}: {error}
      </div>
      <div>
        {i18n.t('dop:pass')}: {passed}
      </div>
      <div>
        {i18n.t('dop:Skipped')}: {skipped}
      </div>
    </div>
  );
  return (
    <Tooltip title={title} placement="right">
      <Progress
        percent={100}
        success={{
          percent: passedPercent,
        }}
        strokeColor={themeColor['default-02']}
        format={(_percent: number, successPercent: number) => `${Math.floor(successPercent)}%`}
      />
    </Tooltip>
  );
};

const CodeCoverage = ({ data }: { data: Array<{ value: number[] }> }) => {
  let rowsTotal = 0;
  let rowsCover = 0;

  data.forEach((item) => {
    rowsTotal += item.value[0] || 0;
    rowsCover += item.value[9] || 0;
  });

  const percent = rowsTotal ? +((rowsCover * 100) / rowsTotal).toFixed(2) : 0;

  const title = (
    <>
      <div>
        {i18n.t('dop:Total number of rows')}: {rowsTotal}
      </div>
      <div>
        {i18n.t('dop:Covering the number of rows')}: {rowsCover}
      </div>
      <div>
        {i18n.t('dop:Line coverage')}: {percent}%
      </div>
    </>
  );
  return (
    <Tooltip title={title} placement="right">
      <Progress
        percent={100}
        success={{
          percent: percent,
        }}
        strokeColor={themeColor['default-02']}
        format={(_percent: number, successPercent: number) => `${Math.floor(successPercent)}%`}
      />
    </Tooltip>
  );
};

const columns: Array<ColumnProps<TEST.RunTestItem>> = [
  {
    title: i18n.t('default:Name'),
    dataIndex: 'name',
    width: 176,
    render: (text) => <span>{cutStr(text, 30, { showTip: true })}</span>,
  },
  {
    title: i18n.t('dop:branch'),
    dataIndex: 'branch',
  },
  {
    title: i18n.t('default:Creator'),
    dataIndex: 'operatorName',
    width: 120,
  },
  {
    title: i18n.t('Creation time'),
    dataIndex: 'createdAt',
    width: 176,
    render: (text) => fromNow(text),
  },
  {
    title: i18n.t('default:Type'),
    dataIndex: 'type',
    width: 120,
  },
  {
    title: i18n.t('dop:Time'),
    dataIndex: ['totals', 'duration'],
    width: 160,
    render: (text) => getTestDuration(text),
  },
  {
    title: i18n.t('dop:execution result'),
    width: 200,
    dataIndex: ['totals', 'tests'],
    render: (_text, record) => <ExecuteResult totals={record.totals} />,
  },
  {
    title: i18n.t('dop:Code Coverage Statistics'),
    width: 200,
    dataIndex: 'coverageReport',
    render: (text: Array<{ value: number[] }>) => <CodeCoverage data={text} />,
  },
];

const TestList = () => {
  const [activeId, setActiveId] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const [reportId, setReportId] = React.useState<number>(null);
  const [list, testListPaging] = applicationTestStore.useStore((s) => [s.list, s.testListPaging]);
  const [isFetching] = useLoading(applicationTestStore, ['getTestList']);
  const { getTestTypes, getTestList } = applicationTestStore.effects;
  const { clearTestList } = applicationTestStore.reducers;
  React.useEffect(() => {
    getTestTypes();
    getTestList({ pageNo: 1 });
    return () => {
      clearTestList();
    };
  }, [clearTestList, getTestList, getTestTypes]);
  const handlePageChange = (pageNo: number) => {
    getTestList({ pageNo });
  };

  const actions = {
    render: (record: { id: number }) => [
      {
        title: i18n.t('view {name}', { name: i18n.t('dop:Coverage') }),
        onClick: () => {
          setReportId(record.id);
          setVisible(true);
        },
      },
    ],
  };

  return (
    <div className="application-test">
      <Spin spinning={isFetching}>
        <ErdaTable
          rowKey="id"
          dataSource={list}
          columns={columns}
          onRow={({ id }: TEST.RunTestItem) => {
            return {
              onClick: () => {
                setActiveId(id);
              },
            };
          }}
          pagination={{
            current: testListPaging.pageNo,
            ...testListPaging,
            onChange: handlePageChange,
          }}
          actions={actions}
        />
      </Spin>

      <TestDetailContainer key={activeId} testId={activeId} onClose={() => setActiveId(0)} />
      <CoverageReport visible={visible} id={reportId} onClose={() => setVisible(false)} />
    </div>
  );
};

export default TestList;
