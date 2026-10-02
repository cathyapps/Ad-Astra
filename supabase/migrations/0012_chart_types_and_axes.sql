-- More chart types (horizontal bar, dual-axis, heatmap, number card) plus
-- the two extra axis slots they need: a second Y metric (dual-axis charts
-- and number cards) and a grouping axis (heatmap rows).
alter table chart_configs drop constraint if exists chart_configs_chart_type_check;
alter table chart_configs
  add constraint chart_configs_chart_type_check
  check (chart_type in ('bar', 'hbar', 'line', 'dual', 'scatter', 'pie', 'heatmap', 'number'));

alter table chart_configs add column if not exists y_axis_2 text;
alter table chart_configs add column if not exists group_axis text;
