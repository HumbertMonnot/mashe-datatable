module DataTables
  class MasheDataTable
    include Enumerable
    include ActionView::Helpers
    include Rails.application.routes.url_helpers
    include ApplicationHelper

    DEFAULT_FORMATTERS = {
      date: ->(value, *args) { value.strftime('%d/%m/%Y') },
      indicators: lambda { |value, *args|
        value.map do |v|
          status = case v
                   when TrueClass then 'success'
                   when FalseClass then 'danger'
                   when Date, Time, DateTime
                     v > Date.current ? 'success' : 'danger'
                   when String then 'neutral'
                   else 'neutral'
                   end
          "<span class='indicator indicator--#{status}'>#{v}</span>"
        end.join.html_safe
      },
      indicator: lambda { |value, *args|
        status = case value
                 when TrueClass then 'success'
                 when FalseClass then 'danger'
                 else 'neutral'
                 end
        "<span class='indicator indicator--#{status}'>#{value}</span>".html_safe
      },
      link: lambda { |value, *args|
        path_helper = args[0]
        params = args[1..-2]
        row = args.last
        final_params = params.map { |param| param == "self" ? row : param }
        ApplicationController.helpers.link_to(value, Rails.application.routes.url_helpers.send(path_helper, *final_params),
                                              class: 'data-link')
      },
      number: lambda { |value, *args|
        value.to_i
      },
      helper: lambda { |value, helper_method, *args, row|
        ApplicationController.helpers.send(helper_method, value, *args)
      },
      currency: lambda { |value, *args|
        value.to_f
      }
    }

    DEFAULT_ATTRIBUTES = {
      title: '',
      size_class: 'col-12',
      columns: [],
      formatters: DEFAULT_FORMATTERS.dup,
      pagination: {
        initial_per_page: 10,
        per_page_options: [5, 10, 25, 50]
      },
      searchable: true,
      actions: [],
      tags: nil,
      checkable: false,
      bulk_actions: nil,
      rows: nil
    }.freeze

    def initialize
      @attributes = DEFAULT_ATTRIBUTES.dup
      @attributes[:columns] = []
      @attributes[:formatters] = DEFAULT_FORMATTERS.dup
    end

    def add_column(header:, method:, formatter: nil, format_params: [], **options)
      @attributes[:columns] << {
        header: header,
        method: method,
        formatter: formatter,
        format_params: format_params
      }.merge(options)
      self
    end

    def add_checkable(checkbox_value_method: :id)
      @attributes[:checkable] = {
        method: checkbox_value_method
      }
      self
    end

    def build_hash
      add_checkable if @attributes[:bulk_actions].present? && @attributes[:checkable].blank?
      @attributes.compact
    end

    def [](key)
      @attributes[key]
    end

    def helpers
      ApplicationController.helpers
    end

    private

    def method_missing(method_name, *args)
      attribute = method_name.to_s.sub(/=$/, '').to_sym
      if @attributes.key?(attribute)
        if method_name.to_s.end_with?('=')
          @attributes[attribute.to_s] = args.first
          @attributes[attribute.to_sym] = args.first
        else
          @attributes[attribute.to_s] || @attributes[attribute.to_sym]
        end
      else
        super
      end
    end

    def respond_to_missing?(method_name, include_private = false)
      attribute = method_name.to_s.sub(/=$/, '').to_sym
      @attributes.key?(attribute) || super
    end
  end
end
