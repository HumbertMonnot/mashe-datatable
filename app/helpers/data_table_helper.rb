module DataTableHelper
  def column_classes(column)
    classes = column[:classes] || []

    # Classes Bootstrap de base
    has_col_class = classes.any? { |c| c.start_with?('col') }

    case column[:type]
    when :checkbox
      classes << "col-auto" unless has_col_class
    when :action
      classes << "col-auto" unless has_col_class
    when :date
      classes << "col-md-2 col-lg-1" unless has_col_class
    when :status
      classes << "col-md-2 col-lg-1" unless has_col_class
    when :name
      classes << "col-md-3" unless has_col_class
    else
      classes << "col" unless has_col_class
    end

    # Classes responsives
    if column[:responsive]
      classes << "d-none d-md-block" if column[:responsive][:mobile] == "hide"
      classes << "d-none d-lg-block" if column[:responsive][:tablet] == "hide"
    end

    classes.join(" ")
  end

  def format_cell_value(row, column, dataset)
    raw_value = row.send(column[:method])

    if column[:formatter] && dataset[:formatters]
      formatter = dataset[:formatters][column[:formatter]]
      format_params = column[:format_params] || []
      formatter.call(raw_value, *format_params, row)
    else
      case column[:type]
      when :date
        raw_value&.strftime("%d/%m/%Y")
      when :datetime
        raw_value&.strftime("%d/%m/%Y %H:%M")
      when :boolean
        raw_value ? "Oui" : "Non"
      when :currency
        number_to_currency(raw_value, unit: "€", format: "%n")
      when :percentage
        number_to_percentage(raw_value, precision: 2)
      else
        raw_value
      end
    end
  end

  def build_link(row, link_config)
    return unless link_config[:path].present?

    # Construction des arguments positionnels et nommés du path
    path_args = process_path_args(row, link_config[:args] || [])
    path_kwargs = process_path_kwargs(row, link_config[:kwargs] || {})

    # Construction des options HTML
    html_options = build_link_html_options(link_config)

    # Construction du contenu du lien
    link_content = build_link_content(row, link_config)

    # Génération du lien
    link_to(
      link_content,
      send(link_config[:path], *path_args, **path_kwargs),
      html_options
    )
  end

  def build_action_link(row, link_config, conditions_met)
    return unless link_config.present?

    link_config = deep_dup_preserving_records(link_config)

    # Enrichir les html_options avec les classes et attributs spécifiques aux actions
    link_config[:html_options] ||= {}

    link_config[:html_options][:class] = []

    # Ajouter les classes de base
    link_config[:html_options][:class] = [
      'dropdown-item',
      link_config[:html_options][:class],
      conditions_met ? nil : 'disabled'
    ].compact.join(' ')

    # Gérer les attributs disabled et onclick
    unless conditions_met
      link_config[:html_options][:disabled] = true
      link_config[:html_options][:onclick] = "return false;"
    end

    # raise if row.id == 393

    # Construire le lien
    build_link(row, link_config)
  end

  def check_action_conditions(row, conditions)
    return true if conditions.blank?

    conditions.all? do |condition|
      row.send(condition[:method]) == condition[:value]
    end
  end

  private

  def process_value(row, value)
    case value
    when "self"
      row.id
    when String
      value.start_with?(':') ? row.send(value.delete(':')) : value
    when Symbol
      row.send(value)
    else
      value
    end
  end

  def process_path_args(row, args)
    args.map { |arg| process_value(row, arg) }
  end

  def process_path_kwargs(row, kwargs)
    kwargs.transform_values { |value| process_value(row, value) }
  end

  def build_link_html_options(config)
    options = { class: 'data-link' }

    options['data-turbo-stream'] = true if config[:turbo_stream].present?
    options['data-turbo-method'] = config[:turbo_method] if config[:turbo_method].present?
    options['data-turbo-confirm'] = config[:turbo_confirm] if config[:turbo_confirm].present?

    options.merge(config[:html_options] || {})
  end

  def build_link_content(row, config)
    content = config[:content]

    case content
    when String
      content.start_with?(':') ? row.send(content.delete(':')) : content
    when Hash
      if content[:helper].present?
        helper_name = content[:helper]
        helper_args = process_helper_args(row, content[:helper_args] || [])
        send(helper_name, *helper_args)
      end
    else
      row.send(config[:text_method])
    end
  end

  def process_helper_args(row, args)
    args.map { |arg| process_value(row, arg) }
  end

  def deep_dup_preserving_records(obj)
    case obj
    when ActiveRecord::Base
      obj # Retourner l'objet tel quel s'il s'agit d'un enregistrement
    when Hash
      obj.transform_values { |value| deep_dup_preserving_records(value) }
    when Array
      obj.map { |value| deep_dup_preserving_records(value) }
    else
      obj.duplicable? ? obj.deep_dup : obj
    end
  end
end
